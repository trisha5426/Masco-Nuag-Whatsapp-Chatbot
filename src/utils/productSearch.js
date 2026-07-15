const tree = require('../data/questionTree.json');

function normalize(text) {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
}

function findProduct(name) {

    if (!name) return tree.products.default;

    const input = normalize(name);

    const keys = Object.keys(tree.products);

    // exact match
    for (const key of keys) {

        if (normalize(key) === input)
            return tree.products[key];

    }

    // partial match
    for (const key of keys) {

        if (normalize(key).includes(input))
            return tree.products[key];

    }

    // reverse partial
    for (const key of keys) {

        if (input.includes(normalize(key)))
            return tree.products[key];

    }

    return tree.products.default;

}

module.exports = { findProduct };