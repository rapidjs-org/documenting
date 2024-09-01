window.rJS__documenting = (() => {
    function resolveElementReference(elReference) {
        const el = !(elReference instanceof HTMLElement)
        ? document.querySelector(elReference)
        : elReference;
        return el;
    }

    class Client {
        #docsRootUrl;
        #tocEl; #contentEl;
        #nestingAElMap = new Map();
        #eventHandlerCbs = {
            "load": [],
            "ready": []
        };
        
        constructor(tocElementReference, contentElementReference, docsRootUrl = "/docs") {
            this.#docsRootUrl = docsRootUrl;
            this.#tocEl = resolveElementReference(tocElementReference);
            this.#contentEl = resolveElementReference(contentElementReference);

            this.#loadData()
            .then(() => {
                this.#invokeEventHandlers("ready", this);
            });
        }

        #invokeEventHandlers(event, ...args) {
            (this.#eventHandlerCbs[event] ?? [])
            .forEach((handlerCb) => handlerCb(...args));
        }

        async #request(url) {
            const isStatusClass = (status, classNumber) => status.toString().charAt(0) === classNumber.toString();

            let res;
            do {
                res = await fetch(url);
                url = res.headers["location"];
            } while(isStatusClass(res.status, 3));

            if(!isStatusClass(res.status, 2)) throw res.status;

            return res;
        }

        async #loadData() {
            let previousSection;
            const render = (section = { sections: this.data }, nesting = []) => {
                section.sections
                .forEach((subSection) => {
                    const subNesting = nesting.concat([ subSection.title ]);

                    subSection.nesting = subNesting;
                    subSection.parent = section;
                    subSection.previous = previousSection;

                    (previousSection ?? {}).next = subSection;
                    previousSection = subSection.sections ? previousSection : subSection;

                    subSection.sections
                    && render(subSection, subNesting);
                });
            };

            const res = await this.#request(encodeURI(`${this.#docsRootUrl}/toc.json`));
            this.data = await res.json();
            render();
        }

        async loadTableOfContents() {
            await this.#loadData();
            
            const render = (sections = this.data) => {
                const olEl = document.createElement("ol");
                sections
                .forEach((section) => {
                    const liEl = document.createElement("li");
                    const aEl = document.createElement("a");
                    
                    aEl.textContent = section.caption;
                    liEl.appendChild(aEl);
                    
                    this.#nestingAElMap.set(section.nesting.join(":"), aEl);
                    
                    aEl.addEventListener("click", () => this.loadSection(section.nesting));
                    
                    (section.title !== "index" || section.sections)
                    && olEl.appendChild(liEl);
                    section.sections
                    && liEl.appendChild(render(section.sections));
                });
                return olEl;
            };
            
            this.#tocEl.appendChild(render());

            return this.data;
        }
        async loadTOC() { return this.loadTableOfContents(); }
        
        async loadSection(nesting, muteEvent = false) { // TODO: Also accept section object
            nesting = (nesting ?? []).length ? nesting : [ "index" ];

            const remainingNesting = [ ...nesting ];
            let currentSection = { sections: this.data };
            do {
                const pivotTitle = remainingNesting.shift();

                let isValidNesting = false;
                for(const section of (currentSection.sections ?? [])) {
                    if(section.title !== pivotTitle) continue;

                    currentSection = section;
                    isValidNesting = true;
                    
                    break;
                }

                if(!isValidNesting) throw new ReferenceError("Invalid nesting");

                if(remainingNesting.length) continue;
                
                currentSection.sections
                && nesting.push(currentSection.sections[0].title);
            } while(remainingNesting.length);
            
            const res = await this.#request(encodeURI(`${
                this.#docsRootUrl
            }/${
                nesting.slice(0, -1).join("/")
            }/${
                [ nesting ]
                .flat()
                .slice(-1)[0]
                .replace(/(\.html)?$/i, ".html")
            }`));

            const markup = await res.text();

            this.#contentEl
            .innerHTML = markup;
            
            !muteEvent
            && this.#invokeEventHandlers(
                "load",
                currentSection,
                this.#nestingAElMap
                .get(nesting.slice(0, (nesting[nesting.length - 1] === "index") ? -1 : nesting.length).join(":"))
            );
            
            return Object.assign({}, currentSection);
        }
        async load(...args) { return this.loadSection(...args); }

        on(event, handlerCb) {
            if(!(handlerCb instanceof Function)) throw new TypeError("Event handler argument is not a function");
            
            (this.#eventHandlerCbs[event] ?? [])
            .push(handlerCb);
            
            return this;
        }
    }

    return { Client };
})();