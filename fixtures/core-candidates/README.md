# Unpublished core inputs

The tarballs in this directory are the selected contrast-corrected **private** core candidates. The workspace lock resolves their exact bytes locally so `npm ci` is reproducible before publication. React package manifests declare normal exact semver dependencies, not local file references or npm aliases. The legacy theme packages remain development dependencies solely for the existing historical reference and compatibility lane.

| Package | Source commit | Version | SHA-256 |
| --- | --- | --- | --- |
| @martlet/core | 4bc45ff0bd1ee2e93ee61917b023f7b45686895f | 2.2.2 | e1fde61cdc818dbdc5b91eb77041111f5651316a63fc9dd3ab5d4dac9536011c |
| @krigsvold/core | 2675078f5fb292920f927b088b87d267dab99701 | 2.2.3 | c74177f9b344b7e517b138b5d0afa9ec0b6b78c1bfdf66f6ffe0570c60b26c66 |

React 0.2.0 is a private proposed release, not a published version. Before any separately authorized release, select final core versions and registry artifacts, replace the local lock resolutions with registry-backed integrity, and repeat the package and consumer matrix. Removing private guards changes package bytes and requires new verification. Never publish these fixture tarballs.
