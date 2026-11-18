# Firefox AMO Publish

A composite GitHub Action that submits an extension zip to [addons.mozilla.org](https://addons.mozilla.org) (AMO) with [`web-ext sign`](https://extensionworkshop.com/documentation/develop/web-ext-command-reference/#web-ext-sign). It does not wait for the review to finish.

`web-ext` signs a directory, so the action unpacks the zip first; the zip must contain the Firefox manifest.

## Inputs

| Name | Required | Default | Description |
|------|----------|---------|-------------|
| `zip` | Yes | | Path to the extension zip |
| `api-key` | Yes | | AMO JWT issuer |
| `api-secret` | Yes | | AMO JWT secret |
| `channel` | No | `listed` | AMO channel (`listed` or `unlisted`) |
| `node-version` | No | `24` | Node.js version used to run `web-ext` |

## Usage

```yaml
publish-firefox:
  needs: [release-please, upload-assets]
  if: needs.release-please.outputs.release-created == 'true'
  runs-on: ubuntu-latest
  steps:
    - uses: actions/download-artifact@9000827ccba6bdab643e8b6fd33ac0654aef8333 # v8.0.2
      with:
        name: extension-packages

    - uses: AutomationDojo/reusable-cicd/.github/actions/firefox-amo-publish@caed38801492a672fe8410fd30d5e43578bc185a # v1.16.0
      with:
        zip: my-extension-firefox.zip
        api-key: ${{ secrets.AMO_JWT_ISSUER }}
        api-secret: ${{ secrets.AMO_JWT_SECRET }}
```
