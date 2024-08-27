window.rJS__documenting = (() => {
    function resolveElementReference(elReference) {
        return !(elReference instanceof HTMLElement)
        ? document.querySelector(elReference)
        : elReference;
    }

    class Client {
        #docsRootUrl;
        #currentArticleNesting;

        constructor(docsRootUrl = "/docs") {
            this.#docsRootUrl = docsRootUrl;
        }

        loadTOC(parentElementReference, entryCb = (() => {}), ) {
            return new Promise((resolve, reject) => {
                fetch(`${this.#docsRootUrl}/toc.json`)
                .then((res) => res.json())
                .then((data) => {
                    const renderLevel = (dataLevel, nesting = []) => {
                        const olEl = document.createElement("ol");
                        dataLevel.forEach((section) => {
                            const subNesting = nesting.concat([ section.title ]);
                            const liEl = document.createElement("li");
                            const aEl = document.createElement("a");
        
                            aEl.textContent = section.title;
                            liEl.appendChild(aEl);
                            olEl.appendChild(liEl);

                            entryCb(aEl, subNesting);
                            
                            if(!section.sections) return;
                            
                            liEl.appendChild(renderLevel(section.sections, subNesting));
                        });
                        return olEl;
                    };

                    resolveElementReference(parentElementReference)
                    .appendChild(renderLevel(data));

                    resolve(this);
                })
                .catch(reject);
            });
        }
        
        loadArticle(parentElementReference, nesting) {
            return new Promise((resolve, reject) => {
                const leaf = nesting.pop() ?? "index";
                
                fetch(`${this.#docsRootUrl}/${nesting.join("/")}/${leaf.replace(/(\.html)?$/i, ".html")}`)
                .then((res) => res.text())
                .then((markup) => {
                    resolveElementReference(parentElementReference)
                    .innerHTML = markup;

                    this.#currentArticleNesting = nesting;

                    resolve();
                })
                .catch((err) => {
                    this.#currentArticleNesting = null;
                    
                    reject(err);
                });
            });
        }
    }

    return {
        Client
    };
})();