# whatwg-preview

Provides previews on hover for links to WHATWG specifications.

## Features

- Hover over a link to a WHATWG specification to see a preview of the specification.
- Open the specification in a vscode webview from the link preview.

![Example preview](images/example.png)

## Extension Settings

None

## Release Notes

### 1.0.0

Initial release

## Development

- The [esbuild Problem Matchers](https://marketplace.visualstudio.com/items?itemName=connor4312.esbuild-problem-matchers) vscode extension is required. Otherwise, this error will occur:
    ```
    Error: Invalid problemMatcher reference: $esbuild-watch
    ```
