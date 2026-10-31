# Unpublished core inputs

The tarballs in this directory are the selected contrast-corrected **private** core candidates. The workspace lock resolves their exact bytes locally so `npm ci` is reproducible before publication. React package manifests declare normal exact semver dependencies, not local file references or npm aliases. The legacy theme packages remain development dependencies solely for the existing historical reference and compatibility lane.

| Package | Source commit | Version | SHA-256 |
| --- | --- | --- | --- |
| @martlet/core | 7200e334acc98d7fb14b61bef767d0e511e38df2 | 2.2.3 | e8a209a29db580d88a2d1c5e0a3a6158d5200c0dcbfeac6e063ce93d88cacbc5 |
| @krigsvold/core | 24d5a7eb9a25f4464f29c4d30e3c675e10ad4888 | 2.2.4 | 057539e5ff9afa518cc249ca8bf7966d13781028f77c279616dfa9293e9a29e1 |

React 0.2.0 is a private proposed release, not a published version. Before any separately authorized release, select final core versions and registry artifacts, replace the local lock resolutions with registry-backed integrity, and repeat the package and consumer matrix. Removing private guards changes package bytes and requires new verification. Never publish these fixture tarballs.
