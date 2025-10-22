import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import Button from "../components/Button";
import LoadingSpinner from "../components/LoadingSpinner";
import { useToast } from "../components/Toast";
import { ApiService } from "../services/apiService";

interface Post {
  id: string;
  title: string;
  content: string;
  author: {
    id: string;
    fullName: string;
    email: string;
  };
  category: string;
  likes: number;
  likedBy?: string[];
  comments?: Comment[];
  createdAt: string;
  updatedAt: string;
  tags: string[];
}

interface Comment {
  id: string;
  content: string;
  author: {
    id: string;
    fullName: string;
  };
  createdAt: string;
}

interface Category {
  id: string;
  name: string;
  description: string;
  postCount: number;
  color: string;
}

export default function Community() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showNewPost, setShowNewPost] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newPost, setNewPost] = useState({
    title: "",
    content: "",
    category: "general",
    tags: "",
  });

  const categories: Category[] = [
    {
      id: "general",
      name: "General Discussion",
      description: "General cooking topics",
      postCount: 0,
      color: "bg-blue-100 text-blue-800",
    },
    {
      id: "recipes",
      name: "Recipe Sharing",
      description: "Share your favorite recipes",
      postCount: 0,
      color: "bg-green-100 text-green-800",
    },
    {
      id: "ingredients",
      name: "Ingredients & Sourcing",
      description: "Finding the best ingredients",
      postCount: 0,
      color: "bg-purple-100 text-purple-800",
    },
    {
      id: "cultural",
      name: "Cultural Exchange",
      description: "Traditional cooking methods",
      postCount: 0,
      color: "bg-red-100 text-red-800",
    },
    {
      id: "tips",
      name: "Cooking Tips",
      description: "Helpful cooking advice",
      postCount: 0,
      color: "bg-yellow-100 text-yellow-800",
    },
  ];

  useEffect(() => {
    fetchPosts();
  }, [selectedCategory]);

  const fetchPosts = async () => {
    try {
      setIsLoading(true);
      const response = await ApiService.getCommunityPosts(selectedCategory);
      setPosts(response.data);
    } catch (error) {
      console.error("Error fetching posts:", error);
      showToast("Failed to load community posts", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPosts =
    selectedCategory === "all"
      ? posts
      : posts.filter((post) => post.category === selectedCategory);

  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showToast("You must be logged in to create a post", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const postData = {
        title: newPost.title,
        content: newPost.content,
        category: newPost.category,
        tags: newPost.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag),
      };

      const response = await ApiService.createCommunityPost(postData);
      setPosts([response.data, ...posts]);
      setShowNewPost(false);
      setNewPost({ title: "", content: "", category: "general", tags: "" });
      showToast("Post created successfully!", "success");
    } catch (error: any) {
      console.error("Error creating post:", error);
      showToast(
        error.response?.data?.message || "Failed to create post",
        "error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLikePost = async (postId: string) => {
    if (!user) {
      showToast("You must be logged in to like posts", "error");
      return;
    }

    try {
      await ApiService.likeCommunityPost(postId);

      // Update the post in the local state
      setPosts((prevPosts) =>
        prevPosts.map((post) => {
          if (post.id === postId) {
            const isLiked = post.likedBy?.includes(user.id);
            return {
              ...post,
              likes: isLiked ? post.likes - 1 : post.likes + 1,
              likedBy: isLiked
                ? (post.likedBy || []).filter((id) => id !== user.id)
                : [...(post.likedBy || []), user.id],
            };
          }
          return post;
        })
      );
    } catch (error: any) {
      console.error("Error liking post:", error);
      showToast("Failed to like post", "error");
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) return "Less than an hour ago";
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="container mx-auto max-w-7xl px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Community Forum
          </h1>
          <p className="text-lg text-gray-600">
            Connect with fellow African food enthusiasts, share recipes, and
            learn from each other.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <div className="text-2xl font-bold text-primary">1,247</div>
            <div className="text-sm text-gray-600">Total Posts</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <div className="text-2xl font-bold text-green-600">3,456</div>
            <div className="text-sm text-gray-600">Active Members</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <div className="text-2xl font-bold text-blue-600">892</div>
            <div className="text-sm text-gray-600">Recipes Shared</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <div className="text-2xl font-bold text-purple-600">156</div>
            <div className="text-sm text-gray-600">Online Now</div>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Categories Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Categories</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedCategory("all")}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    selectedCategory === "all"
                      ? "bg-primary text-white"
                      : "hover:bg-gray-100"
                  }`}
                >
                  All Posts
                </button>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      selectedCategory === category.id
                        ? "bg-primary text-white"
                        : "hover:bg-gray-100"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-sm">{category.name}</span>
                      <span className="text-xs opacity-70">
                        {category.postCount}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Featured Categories */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Popular Categories</h3>
              <div className="space-y-3">
                {categories.slice(0, 3).map((category) => (
                  <div
                    key={category.id}
                    className="border-l-4 border-primary pl-3"
                  >
                    <h4 className="font-medium text-gray-900">
                      {category.name}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {category.description}
                    </p>
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs ${category.color} mt-1`}
                    >
                      {category.postCount} posts
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* New Post Button */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold">
                    Community Discussions
                  </h2>
                  <p className="text-gray-600">
                    Share your thoughts and connect with others
                  </p>
                </div>
                {user ? (
                  <Button
                    onClick={() => setShowNewPost(!showNewPost)}
                    className="bg-primary hover:bg-primary/90 text-white"
                  >
                    + New Post
                  </Button>
                ) : (
                  <div className="text-sm text-gray-500">
                    <a href="/signin" className="text-primary hover:underline">
                      Sign in
                    </a>{" "}
                    to post
                  </div>
                )}
              </div>
            </div>

            {/* New Post Form */}
            {showNewPost && user && (
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">Create New Post</h3>
                <form onSubmit={handleSubmitPost} className="space-y-4">
                  <div>
                    <input
                      type="text"
                      placeholder="Post title..."
                      value={newPost.title}
                      onChange={(e) =>
                        setNewPost({ ...newPost, title: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <select
                      value={newPost.category}
                      onChange={(e) =>
                        setNewPost({ ...newPost, category: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <textarea
                      placeholder="Share your thoughts..."
                      value={newPost.content}
                      onChange={(e) =>
                        setNewPost({ ...newPost, content: e.target.value })
                      }
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Tags (comma separated)"
                      value={newPost.tags}
                      onChange={(e) =>
                        setNewPost({ ...newPost, tags: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button
                      type="submit"
                      loading={isSubmitting}
                      disabled={isSubmitting}
                      className="bg-primary hover:bg-primary/90 text-white"
                    >
                      {isSubmitting ? "Posting..." : "Post"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowNewPost(false)}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* Posts List */}
            {isLoading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner
                  size="lg"
                  message="Loading community posts..."
                />
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <div className="text-6xl mb-4">💬</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No Posts Yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Be the first to start a conversation in this category!
                </p>
                {user && (
                  <Button
                    onClick={() => setShowNewPost(true)}
                    className="bg-primary hover:bg-primary/90 text-white"
                  >
                    Create First Post
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPosts.map((post) => {
                  const isLiked = user && post.likedBy?.includes(user.id);

                  return (
                    <div
                      key={post.id}
                      className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:text-primary cursor-pointer">
                            {post.title}
                          </h3>
                          <p className="text-gray-600 mb-3">{post.content}</p>

                          {/* Tags */}
                          {post.tags && post.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3">
                              {post.tags.map((tag, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Post Meta */}
                      <div className="flex justify-between items-center text-sm text-gray-500">
                        <div className="flex items-center gap-4">
                          <span className="font-medium text-primary">
                            {post.author.fullName}
                          </span>
                          <span>{formatTimeAgo(post.createdAt)}</span>
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              categories.find((c) => c.id === post.category)
                                ?.color
                            }`}
                          >
                            {
                              categories.find((c) => c.id === post.category)
                                ?.name
                            }
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => handleLikePost(post.id)}
                            className={`flex items-center gap-1 hover:text-red-600 transition-colors ${
                              isLiked ? "text-red-600" : "text-gray-500"
                            }`}
                            disabled={!user}
                            title={
                              !user
                                ? "Login to like posts"
                                : isLiked
                                ? "Unlike"
                                : "Like"
                            }
                          >
                            <svg
                              className={`w-4 h-4 ${
                                isLiked
                                  ? "fill-current"
                                  : "fill-none stroke-current"
                              }`}
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                                clipRule="evenodd"
                              />
                            </svg>
                            {post.likes}
                          </button>
                          <span className="flex items-center gap-1">
                            <svg
                              className="w-4 h-4"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
                                clipRule="evenodd"
                              />
                            </svg>
                            {post.comments?.length || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
