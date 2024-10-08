# rJS Documenting

Headless Markdown documentation framework (push or pull) – with syntax extensions for software documentation.

``` cli
npm install -D @rapidjs.org/documenting
```

Documentation sites represent a content-heavy application type. It is thus common practice to maintain Markdown files that are eventually rendered to HTML for display. rJS Documenting is a powerful Markdown documentation framework with a headless API. The framework embodies two components: The essential component is a service agent to regularly render files from a designated source to a directory public to the web. This way, documentation files can be requested like ordinary files and used in an unopinionated way. The second (optional) component is a lean client module that can be loaded from a displaying site context. The client module simplifies access of the rendered documentation resources and the overall documentation structure.

1. [Renderer](#renderer)
1. [Agents](#agents)
1. [Client](#client)

## Renderer

The fundamental Markdown to HTML transpiler used with rJS Documenting is [markdown-it](https://github.com/markdown-it/markdown-it). It is abstracted by the `Renderer` class that can be configured just as *markdown-it* instances. Furthermore, extra rules can be disabled if desired. The renderer is activated from within individual agents.

``` ts
class Renderer {
  constructor(
    configuration: markdownit.PresetName|markdownit.Options = "commonmark",
    enableExtraRules: boolean = true
  );
}
```

Upon activation, the renderer reads the sourced file hierarchy and replicates it in a designated target directory. In addition, a table of contents file is generated as a JSON file (`toc.json`). In order to enforce a certain order in the filesystem, file names are supposed to be preceeded by numbers (`<n>. <file-name>`). Such numeric indicators are stripped from rendered file names and identifiers. Also, files named `index` are always interpreted as the first subsection. In addition to the bare identifier, the `toc.json` file enriches the entries with a caption. If the entry is a Markdown file with a leading heading, the heading is used as the caption. Otherwise, the caption is the capitalised file name with spaces substituted dashes and underscores.

```
└─ /documentation
  ├─ 1. basics
  │  ├─ _assets
  │  │  └─ img.png
  │  ├─ 1. usage.md
  │  ├─ index.md
  │  └─ 2. commands.md
  └─ 2. further-reading.md
```

```
└─ /public/web
  ├─ basics
  │  ├─ commands.html
  │  ├─ index.html
  │  └─ usage.html
  └─ further-reading.html
```

``` json
[
  {
    "title": "basics",
    "caption": "Basics",
    "sections": [
      {
        "title": "index",
        "caption": "Basics"
      },
      {
        "title": "usage",
        "caption": "Usage"
      }
      {
        "title": "commands",
        "caption": "Commands List"
      }
    ],
  },
  {
    "title": "further-reading",
    "caption": "Further Reading"
  }
]
```

``` ts
interface ISection {
  title: string;
  caption: string;
  sections?: ISection[];
}

type TTableOfContents = ISection[]
```

### Working with Assets

rJS Documenting enables use of assets – like images or videos – in an opinionated way: Within the Markdown source directory, assets are supposed to be stored in a directories named `_assets`. From there, they can be relatively referenced as usual. Upon render, files are automatically copied and accessible from the client module.

### Extra Rules

Extra rules are an optional addition to ubiquitous Markdown syntax defined by rJS Documenting. They are designed after common elements used among software documentations. Extra rules result in a specific HTML element structure, and the parent element is assigned a descriptive class.

#### Syntax Definition

Syntax definitions – as used in ([MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/API/Window/fetch#syntax)) – represent a specific type of fenced code block. Therefore, rJS Documenting defines the fenced code language `syntax`.

```` md
``` syntax
helloWorld(): string
```
````

``` html
<div class="rJS__documenting--syntax">
  <code>
    helloWorld(): string
  </code>
</div>
```

#### Parameter Definition

Parameter definitions are a common supplement to syntax definitions. rJS Documenting defines a superordinate parameter definitions block rule. Parameter definitions are two column tables, but with a token instead of header information.

``` md
[ parameters ]
| argument 1 | Example argument at pos 0. |
| `arg2` | Example argument at pos 1. |
```

``` html
<table class="rJS__documenting--parameter">
  <tr>
    <td>
      <code>argument 1</code>
    </td>
    <td>
      <p>Example argument at pos 0.</p>
    </td>
  </tr>
  <tr>
    <td>
      <code>arg2</code>
    </td>
    <td>
      <p>Example argument at pos 1.</p>
    </td>
  </tr>
</table>
```

## Agents

rJS Documenting provides several agents to maintain an up to date documentation. The abstract distinction is between the orthogonal update strategies – push and pull. A pull agent periodically polls the source for updates in order to re-render the documentation. A push agent, on the other hand, waits for external events to trigger a re-rendering of the sourced Markdown files. Push agents are preferrable for documentation sites that are ought to reflect updates to the source instantly. Moreover, rJS Documenting supports different types of sources that serve the raw Markdown documentation files in a hierarchically fashion.

``` ts
abstract class Agent {
  start(): Promise<void>;    // Method to be called for starting the agent
}
```

### Filesystem Pull Agent

The simplest way to implement rJS Documenting is by using the Filesystem Pull Agent. This agent pulls from a directory on local disc in a specific interval.

``` ts
class FSPullAgent extends Agent {
  constructor(options: {
    targetDirPath: string;  // Path to target directory
    sourceDirPath: string;  // Path to source directory
		interval?: number;      // Pull interval in ms
  }, renderer?: Renderer)
}
```

> By default, pull agents request request updates every 12 hours.

### GitHub Pull Agent

Instead of pulling from local disc, the GitHub Pull Agent bases on a specified GitHub repository as source.

``` ts
class GHPullAgent extends Agent  {
  constructor(options: {
    targetDirPath: string;  // Path to target file directory
    account: string;        // GitHub user (or organisation) name
    repository: string;     // GitHub repository name
    rootPath?:              // Relative path to root directory in repository  ("." by default)
    ref?: string;           // Repository reference ('main' by default)
    auth?: string;          // GitHub API authentication token (if is private repository)
		interval?: number;      // Pull interval in ms
  }, renderer?: Renderer)
}
```

### GitHub Push Agent

Open Source projects commonly provide the documentation as a meta project in a GitHub repository. The GitHub Push Agent listens for any directed webhook event triggered in a specified GitHub repository.

``` ts
class GHPushAgent extends Agent  {
  constructor(options: {
    targetDirPath: string;  // Path to target file directory
    account: string;        // GitHub user (or organisation) name
    repository: string;     // GitHub repository name
    rootPath?:              // Relative path to root directory in repository  ("." by default)
    ref?: string;           // Repository reference ('main' by default)
    auth?: string;          // GitHub API authentication token (if is private repository)
    secret?: string;        // GitHub webhook secret
    port?: number;          // Port to listen for events on with HTTP (6001 by default)
  }, renderer?: Renderer)
}
```

> A push agent filters requests to match the pathname `/`, `/documentation`, or `/docs`.

### Example

``` js
new GHPushAgent({
    targetDirPath: "./public/docs/",
    account: "rapidjs-org",
    repository: "documenting",
    secret: "X5QgcpFc1a"
})
.start()
.then(() => console.log("Docs agent running…"));
```

## Client

``` html
<script src="https://cdn.jsdelivr.net/npm/@rapidjs.org/documenting@latest/build/client/rjs.documenting.js"></script>
```

As pointed out, rendered documentation files are supposed to reside in a public web directory. The documentation can inherently be presented based on those static files in a preferred way. However, the provided rJS Documenting client module helps with working with the documentation files through a simple API.

``` ts
class rJS__documenting.Client {
  data: TTableOfContents

  constructor(
    tocElementReference: HTMLElement,       // Table of contents parent element (DOM element or query string)
    contentElementReference: HTMLElement,   // Article content parent element (DOM element or query string)
    docsRootUrl: string = "/docs"           // Pathname of (render) target root directory on public host
  )

  // Load the table of contents
  async loadTableOfContents(): void // (alias loadTOC())

  // Load an article given an identifier nesting (e.g. [ "basics", "usage" ])
  async loadSection(
    nesting: string[] = "index",
    muteEvent: boolean = false  // Whether to not emit the 'load' event
  ): ISection & {
    nesting: string[];
    parent: ISection;
    next?: ISection;
    previous?: ISection;
  } // (alias load())

  // Bind an event listener
  on(event: string, handlerCb: (...args) => void): this
}
```

### Events

#### `load`

The load event is invoked each time a section was attempted to be loaded. If an error has occurred, it is passed as the first argument to the handler. Subsequently, the loaded section object (`ISection`), and – if exists – a reference to the related anchor element in the table of contents element are passed.

#### `ready`

The ready event is invoked once when the documentation data was fetched and processed. It is initiated from the constructor call of the `Client` class.

### Example

``` js
addEventListener("DOMContentLoaded", () => {
  const docsClient = new rJS__documenting.Client(
    "#content",
    document.querySelector("#navigation")
  )
  .on("load", (err, newSection) => {
    if(err) throw err;

    window.history.pushState(
      newSection.nesting, null,
      `${document.location.pathname}?p=${newSection.nesting.join(":")}`
    );
  })
  .on("ready", client => {
    client.loadTableOfContents();
    client.loadSection(
      (new URLSearchParams(window.location.search).get("p") ?? "")
      .split(/:/g)
    );
  });

  addEventListener("popstate", e => docsClient.loadSection(e.state, true));
});
```

##

<sub>© Thassilo Martin Schiepanski</sub>
