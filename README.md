# rJS Documenting

Headless, unopinionated documentation framework for heterogeneous Markdown sources – with syntax extensions for software documentation.

``` cli
npm install -D @rapidjs-org/documenting
```

Documentation sites represent a content-heavy application type. It is thus common practice for documentations to encode them through Markdown files that are rendered to HTML for display. rJS Documenting is a powerful framework to host documentation sites based on Markdown sources. The framework embodies two components: The essential component is a service agent to regularly render files from a designated source to a directory public to the web. This way, documentation files can be requested like ordinary files and used in an unopinionated way. The second (optional) component is a lean client module that can be loaded from a displaying site context. The client module simplifies access of the rendered documentation resources and the overall documentation structure.

## Renderer

The fundamental Markdown to HTML transpiler used with rJS Documenting is [markdown-it](https://github.com/markdown-it/markdown-it). It is abstracted by the `Renderer` class that can be configured just as *markdownit* instances. Furthermore, extra rules can be disabled if desired. The renderer is activated from within individual agents.

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

### Extra Rules

Extra rules are an optional addition to ubiquitous Markdown syntax defined by rJS Documenting. They are designed after common elements used among software documentations. Extra rules result in a specific HTML element structure, and the parent element is assigned a descriptive class.

#### Syntax Definition

Syntax definitions – as used in ([MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/API/Window/fetch#syntax)) – represent a specific type of fenced code block. Therefore, rJS Documenting defines the fenced code language `syntax`.

``` md
\``` syntax
helloWorld(): string
\```
```

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
        ref?: string;           // Repository reference ('main' by default)
        auth?: string;          // GitHub API authentication token (if is private repository)
        secret?: string;        // GitHub webhook secret
	    port?: number;          // Port to listen for events on with HTTP (6001 by default)
    }, renderer?: Renderer)
}
```

#### Example

``` js
new GHPushAgent({
    targetDirPath: "./public/docs/",
    account: "rapidjs-org",
    repository: "documenting"
    secret: "X5QgcpFc1a";
})
.start()
.then(() => console.log("Docs agent running..."));
```

## Client Module

As pointed out, rendered documentation files are supposed to reside in a public web directory. The documentation can inherently be presented based on those static files in a preferred way. However, the provided rJS Documenting client module helps with working with the documentation files through a simple API.

``` ts
class Client {
    constructor(
        tocElementReference: HTMLElement,       // Table of contents parent element (DOM element or query string)
        contentElementReference: HTMLElement,   // Article content parent element (DOM element or query string)
        docsRootUrl: string = "/docs"           // Pathname of (render) target root directory on public host
    )

    // Load the table of contents
    async loadTOC(entryCb?: (aEl: HTMLAnchorElement, subNesting: string[]) => void): TTableOfContents

    // Load an article given a nesting of identifiers (e.g. [ "basics", "usage" ])
    async loadArticle(nesting: string[]): ISection & {
        nesting: string[];
        parent: ISection;
        next?: ISection;
        previous?: ISection;
    }
}
```

##

<sub>© Thassilo Martin Schiepanski</sub>