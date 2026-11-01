#!/usr/bin/env python3
"""Validate the proposed host matrix; optionally make read-only HTTPS requests.

HTTP replies describe what curl observed, not verified deployment identity. Network,
proxy, TLS, and command failures are inconclusive rather than failed deployments.
"""
import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DEFAULT_PLAN = ROOT / 'docs/qa/nightjar-site-hosts.json'
LABEL = re.compile(r'(?=.{1,253}\Z)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}\Z')

def hosts(plan):
    if not isinstance(plan, dict) or set(plan) != {'schemaVersion', 'main', 'reference'} or plan['schemaVersion'] != 1:
        raise ValueError('invalid host plan schema')
    result = []
    for family in ('martlet', 'krigsvold'):
        if set(plan['main']) != {'martlet', 'krigsvold'} or set(plan['reference']) != {'martlet', 'krigsvold'}:
            raise ValueError('invalid family matrix')
        main = plan['main'][family]
        refs = plan['reference'][family]
        if not isinstance(main, str) or not LABEL.fullmatch(main) or not isinstance(refs, dict) or set(refs) != {'astro', 'react', 'jekyll'}:
            raise ValueError('invalid host or framework matrix')
        result.append((family, 'main', main))
        for framework in ('astro', 'react', 'jekyll'):
            host = refs[framework]
            if not isinstance(host, str) or not LABEL.fullmatch(host) or host != f'{framework}.{main}':
                raise ValueError('reference host must match its framework and main domain')
            result.append((family, framework, host))
    if len({item[2] for item in result}) != 8:
        raise ValueError('duplicate host')
    return result

def observe(curl, host):
    command = [curl, '--head', '--silent', '--show-error', '--max-time', '12', '--output', '/dev/null',
               '--write-out', '%{http_code}', f'https://{host}/']
    try:
        result = subprocess.run(command, capture_output=True, text=True, timeout=15, check=False)
    except (OSError, subprocess.TimeoutExpired) as error:
        return {'classification': 'inconclusive', 'reason': type(error).__name__}
    code = result.stdout.strip()
    if result.returncode != 0 or not re.fullmatch(r'[1-5][0-9]{2}', code):
        return {'classification': 'inconclusive', 'curlExit': result.returncode, 'httpCode': code or None,
                'reason': 'transport, proxy, TLS or timeout error; do not infer deployment failure'}
    return {'classification': 'http_response', 'httpCode': int(code),
            'reason': 'response observed; origin identity and deployed revision were not verified'}

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--plan', type=Path, default=DEFAULT_PLAN)
    parser.add_argument('--online', action='store_true', help='make read-only HTTPS HEAD requests')
    parser.add_argument('--curl', default='curl', help='curl executable (for reproducible fixture tests)')
    args = parser.parse_args()
    try:
        items = hosts(json.loads(args.plan.read_text()))
    except (OSError, ValueError, TypeError, KeyError) as error:
        print(f'invalid plan: {error}', file=sys.stderr)
        return 2
    output = [{'family': family, 'framework': framework, 'host': host,
               **(observe(args.curl, host) if args.online else {'classification': 'not_checked'})}
              for family, framework, host in items]
    print(json.dumps({'schemaVersion': 1, 'online': args.online, 'results': output}, indent=2))
    return 0 if not args.online or all(x['classification'] == 'http_response' for x in output) else 1

if __name__ == '__main__':
    raise SystemExit(main())
