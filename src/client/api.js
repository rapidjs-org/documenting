window.rJS__documenting = (() => {
    function resolveElementReference(elReference) {
        const el = !(elReference instanceof HTMLElement)
        ? document.querySelector(elReference)
        : elReference;
        if(!el) throw new ReferenceError(`Element reference could not be resolved '${elReference}'`);
        return el;
    }

    class Client {
        #docsRootUrl;
        #tocEl; #contentEl;
        #data;

        constructor(tocElementReference, contentElementReference, docsRootUrl = "/docs") {
            this.#docsRootUrl = docsRootUrl;
            this.#tocEl = resolveElementReference(tocElementReference);
            this.#contentEl = resolveElementReference(contentElementReference);
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
            if(this.#data) return;

            const res = await this.#request(encodeURI(`${this.#docsRootUrl}/toc.json`));
            this.#data = await res.json();
        }

        async loadTOC(entryCb = (() => {})) {
            await this.#loadData();
            
            let previousSection;
            const render = (section = { sections: this.#data }, nesting = []) => {
                const olEl = document.createElement("ol");
                section.sections
                .forEach((subSection) => {
                    const subNesting = nesting.concat([ subSection.title ]);
                    const liEl = document.createElement("li");
                    const aEl = document.createElement("a");
                    
                    subSection.nesting = subNesting;
                    subSection.parent = section;
                    subSection.previous = previousSection;

                    (previousSection ?? {}).next = subSection;
                    previousSection = subSection.sections ? previousSection : subSection;
                    
                    aEl.textContent = subSection.caption;
                    liEl.appendChild(aEl);

                    entryCb(aEl, subNesting);

                    (subSection.title !== "index" || subSection.section)
                    && olEl.appendChild(liEl);
                    subSection.sections
                    && liEl.appendChild(render(subSection, subNesting));
                });
                return olEl;
            };
            
            this.#tocEl.appendChild(render());
        }
        
        async loadArticle(nesting) {
            await this.#loadData();

            nesting = [ (nesting ?? []).length ? nesting : "index" ].flat();

            const remainingNesting = [ ...nesting ];
            let currentSection = { sections: this.#data };
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

            return currentSection;
        }
    }
    
    return { Client };
})();