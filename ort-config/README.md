# ORT License Inventory

This repository includes a non-blocking ORT license scan workflow at
`../.github/workflows/license-scan.yml`.

The ORT configuration for this repository lives in this directory:

- `config.yml`
- `curations.yml`
- `resolutions.yml`

## Local Usage

To run the same scan locally, install dependencies and then run ORT from the
official container image:

```sh
pnpm install --frozen-lockfile --ignore-scripts

rm -rf ort-results
mkdir -p ort-results/analyzer

docker run --rm \
  --user "$(id -u):$(id -g)" \
  --workdir /project \
  --volume "$PWD:/project" \
  --env HOME=/tmp/ort-home \
  --env ORT_CONFIG_DIR=/project/ort-config \
  --env ORT_DATA_DIR=/tmp/ort-data \
  ghcr.io/oss-review-toolkit/ort:latest \
  --info \
  --stacktrace \
  analyze \
  -f JSON \
  -i /project \
  -o /project/ort-results/analyzer

docker run --rm \
  --user "$(id -u):$(id -g)" \
  --workdir /project \
  --volume "$PWD:/project" \
  --env HOME=/tmp/ort-home \
  --env ORT_CONFIG_DIR=/project/ort-config \
  --env ORT_DATA_DIR=/tmp/ort-data \
  ghcr.io/oss-review-toolkit/ort:latest \
  --info \
  --stacktrace \
  report \
  -i /project/ort-results/analyzer/analyzer-result.json \
  -o /project/ort-results \
  -f CycloneDx,SpdxDocument,WebApp \
  -O CycloneDX=output.file.formats=json,xml \
  -O SpdxDocument=output.file.formats=json,yaml \
  -O SpdxDocument=document.name=idos-sdk-js
```
