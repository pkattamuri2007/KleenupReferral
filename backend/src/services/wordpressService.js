const axios = require("axios");
const { wpBaseUrl, wpUsername, wpAppPassword } = require("../config/env");

const authToken = Buffer.from(`${wpUsername}:${wpAppPassword}`).toString("base64");

const wpClient = axios.create({
  baseURL: `${wpBaseUrl}/wp-json`,
  headers: {
    Authorization: `Basic ${authToken}`,
    "Content-Type": "application/json",
  },
});

async function fetchPosts(page = 1, perPage = 10) {
  const response = await wpClient.get("/wp/v2/posts", {
    params: {
      page,
      per_page: perPage,
    },
  });

  return response.data;
}

async function fetchUsers(page = 1, perPage = 10) {
  const response = await wpClient.get("/wp/v2/users", {
    params: {
      page,
      per_page: perPage,
    },
  });

  return response.data;
}

module.exports = {
  fetchPosts,
  fetchUsers,
};