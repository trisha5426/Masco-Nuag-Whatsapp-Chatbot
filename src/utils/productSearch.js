const tree = require('../data/questionTree.json');

function normalize(text) {
    return text
        .toLowerCase()
        .trim();
}

function findProduct(productName) {

    if (!productName)
        return tree.products.default;

    const input = normalize(productName);

    const keys = Object.keys(tree.products);

    // Exact match
    for (const key of keys) {

        if (normalize(key) === input)
            return tree.products[key];

    }

    // Partial match
    for (const key of keys) {

        if (normalize(key).includes(input))
            return tree.products[key];

    }

    // Reverse match
    for (const key of keys) {

        if (input.includes(normalize(key)))
            return tree.products[key];

    }

    return tree.products.default;

}

module.exports = {
    findProduct
};
