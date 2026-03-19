const { fetchPosts, fetchUsers } = require("../services/wordpressService");

async function getPosts(req, res) {
  try {
    const page = Number(req.query.page) || 1;
    const perPage = Number(req.query.perPage) || 10;

    const posts = await fetchPosts(page, perPage);

    const cleanedPosts = posts.map((post) => ({
      id: post.id,
      date: post.date,
      slug: post.slug,
      title: post.title?.rendered || "",
      status: post.status,
      link: post.link,
    }));

    res.json(cleanedPosts);
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch posts from WordPress",
      details: error.response?.data || error.message,
    });
  }
}

async function getUsers(req, res) {
  try {
    const page = Number(req.query.page) || 1;
    const perPage = Number(req.query.perPage) || 10;

    const users = await fetchUsers(page, perPage);

    const cleanedUsers = users.map((user) => ({
      id: user.id,
      name: user.name,
      slug: user.slug,
      url: user.url,
    }));

    res.json(cleanedUsers);
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch users from WordPress",
      details: error.response?.data || error.message,
    });
  }
}

module.exports = {
  getPosts,
  getUsers,
};