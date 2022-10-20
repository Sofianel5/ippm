# IPPM (Interplanetary package manager): Distributed package manager build on IPFS and OrbitDB

## Benefits

- Ever had to deal with a repository having missing/dead dependencies? IPPM uses the IPFS content addressing network to find a particular file regardless of its location on the internet.
- Sovereign: Critical infastructure relies on several centralized chokepoints (pkg-containers.githubusercontent.com, ghcr.io/) to install packages needed to run code
- Secure: Hash based addressing and digital signatures makes it impossible to modify packages and insert malitious code. Supply chain attacks are much harder to orchestrate.

## Downsides

- Slow: The IPFS p2p network is pretty slow to find content you want, and is often unreliable and unable to find the content you need.
- Higher user burden: IPFS and OrbitDB require users to replicate content to ensure its availability on the network. OrbitDB requires users to replicate nested databases to query them.
