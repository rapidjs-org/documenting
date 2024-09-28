export default [
	// Syntax definition
	(markdown: string) =>
		markdown.replace(
			/(?:^|\n) {0,3}``` *syntax *\n(((?!\n {0,3}```)(\s|.))*)\n {0,3}``` *(?:\n|$)/g,
			(_, code: string) => {
				return `<div class="rJS__documenting--syntax"><code>${code.trim()}</code></div>`;
			}
		),

	// Parameter definition
	(markdown: string) =>
		markdown.replace(
			/(?:^|\n) {0,3}\[ *(param(?:eter)?s?|arg(?:ument)?s?) *\] *((?:\n *\|[^|\n]+\|[^|\n]+\| *){1,})(?:\n|$)/g,
			(_, __, body: string) => {
				return `<table class="rJS__documenting--parameter">${body
					.trim()
					.split(/\n/g)
					.map((row: string) => {
						return `<tr>${row
							.trim()
							.slice(1, -1)
							.split(/\|/g)
							.map((cell: string, i: number) => {
								return `<td>${i === 0 ? "<code>" : "<p>"}${
									i === 0
										? cell.trim().replace(/^`|`$/g, "")
										: cell.trim()
								}${i === 0 ? "</code>" : "</p>"}</td>`;
							})
							.join("")}</tr>`;
					})
					.join("")}</table>`;
			}
		),

	// File Structure
	(markdown: string) => markdown // TODO
];
