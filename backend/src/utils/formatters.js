const crypto = require("crypto");

function normalizeAddressForHash(address) {
	return String(address || "")
		.trim()
		.toLowerCase()
		.replace(/\s+/g, " ");
}

function hashNormalizedAddress(address) {
	return crypto
		.createHash("sha256")
		.update(normalizeAddressForHash(address))
		.digest("hex");
}

function roundCurrency(value) {
	const num = Number(value || 0);
	return Math.round((num + Number.EPSILON) * 100) / 100;
}

function toDate(value) {
	const date = value instanceof Date ? value : new Date(value);
	if (Number.isNaN(date.getTime())) {
		throw new Error(`Invalid date value: ${value}`);
	}
	return date;
}

// Full month diff used for temporal decay tier selection.
function diffFullMonths(startDate, endDate) {
	const start = toDate(startDate);
	const end = toDate(endDate);

	let months =
		(end.getUTCFullYear() - start.getUTCFullYear()) * 12 +
		(end.getUTCMonth() - start.getUTCMonth());

	if (end.getUTCDate() < start.getUTCDate()) {
		months -= 1;
	}

	return Math.max(months, 0);
}

module.exports = {
	normalizeAddressForHash,
	hashNormalizedAddress,
	roundCurrency,
	toDate,
	diffFullMonths,
};
