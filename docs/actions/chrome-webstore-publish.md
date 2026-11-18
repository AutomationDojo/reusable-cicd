# Chrome Web Store Publish

A composite GitHub Action that uploads an extension zip to the Chrome Web Store and submits it for review, through the [Chrome Web Store API v2](https://developer.chrome.com/docs/webstore/api).

It authenticates with [Workload Identity Federation](https://github.com/google-github-actions/auth#preferred-direct-workload-identity-federation): the job gets a short-lived Google access token for a service account, so no key or refresh token is stored. Large uploads processed asynchronously are polled for up to 5 minutes.

## Prerequisites

- A GCP Workload Identity Provider that trusts the caller repository.
- A service account added to the Chrome Web Store publisher, with access to the item.
- The calling job must set `permissions: id-token: write`.

## Inputs

| Name | Required | Description |
|------|----------|-------------|
| `zip` | Yes | Path to the extension zip |
| `extension-id` | Yes | Chrome Web Store item ID |
| `publisher-id` | Yes | Chrome Web Store publisher ID |
| `workload-identity-provider` | Yes | Full resource name of the Workload Identity Provider |
| `service-account` | Yes | Service account email |

## Usage

```yaml
publish-chrome:
  needs: [release-please, upload-assets]
  if: needs.release-please.outputs.release-created == 'true'
  runs-on: ubuntu-latest
  permissions:
    contents: read
    id-token: write
  steps:
    - uses: actions/download-artifact@9000827ccba6bdab643e8b6fd33ac0654aef8333 # v8.0.2
      with:
        name: extension-packages

    - uses: AutomationDojo/reusable-cicd/.github/actions/chrome-webstore-publish@caed38801492a672fe8410fd30d5e43578bc185a # v1.16.0
      with:
        zip: my-extension-chrome.zip
        extension-id: abcdefghijklmnopabcdefghijklmnop
        publisher-id: ${{ secrets.CWS_PUBLISHER_ID }}
        workload-identity-provider: ${{ vars.GCP_WORKLOAD_IDENTITY_PROVIDER }}
        service-account: ${{ vars.CWS_SERVICE_ACCOUNT }}
```
