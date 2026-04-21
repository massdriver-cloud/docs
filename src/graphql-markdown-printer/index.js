/**
 * Local printer override for @graphql-markdown/docusaurus.
 *
 * The upstream printer-legacy runs every schema description through a
 * regex-based MDX escape that includes `*` and `_`, which breaks legit
 * markdown emphasis (`**bold**` renders as literal `**bold**`). The
 * library's own docs say it should only escape `{ < > }` — the chars
 * that crash MDX's JSX parser — so this override restores that scope.
 *
 * Mechanism: common.printDescription calls formatDescription through
 * the module's exports object, so reassigning common.formatDescription
 * at require time redirects every description through our version.
 */
const printerLegacy = require("@graphql-markdown/printer-legacy");
const common = require("@graphql-markdown/printer-legacy/common");
const strings = require("@graphql-markdown/printer-legacy/const/strings");
const utils = require("@graphql-markdown/utils");

const escapeMDXJsxOnly = (str) => {
  return String(str).replaceAll(
    /(?<!`)([{<>}])(?=(?:[^`]*`[^`]*`)*[^`]*$)/g,
    utils.toHTMLUnicode,
  );
};

const formatDescription = (type, replacement = strings.NO_DESCRIPTION_TEXT) => {
  if (!utils.isTypeObject(type)) {
    return `${strings.MARKDOWN_EOP}${escapeMDXJsxOnly(replacement)}`;
  }
  const description = utils.hasStringProperty(type, "description")
    ? type.description
    : replacement;
  return `${strings.MARKDOWN_EOP}${escapeMDXJsxOnly(description)}`;
};

common.formatDescription = formatDescription;

module.exports = printerLegacy;
