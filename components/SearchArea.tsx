"use client";

import React, { useState, useContext } from "react";
import Usercard from "./Usercard";
import { UrlContext } from "../context/urlContext";
import "../app/globals.css";
import Header from "./Header";
import Tweet from "./Tweet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";

function SearchArea() {
  const [text, setText] = useState("");
  const [users, setUsers] = useState([]);
  const [tweets, setTweets] = useState([]);
  const [recommendedTags, setRecommendedTags] = useState<string[]>([]);
  const [skip, setSkip] = useState(0); // For pagination
  const [hasMoreTweets, setHasMoreTweets] = useState(true); // To track if more tweets are available
  const [activeUser, setActiveUser] = useState("");
  const url = useContext(UrlContext);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (text.trim().length === 0) return;

    const req = await fetch(`${e.currentTarget.action}?skip=0&limit=10`, {
      headers: {
        "x-access-token": localStorage.getItem("token") || "",
      },
    });

    const data = await req.json();
    if (data.status === "ok") {
      setActiveUser(data.activeUser);
      setUsers(data.users);
      setTweets(data.tweets);
      setRecommendedTags(data.recommendedTags || []);
      setSkip(10); // Reset skip for pagination
      setHasMoreTweets(data.tweets.length === 10); // Check if more tweets are available
    } else {
      console.log(data.error);
    }
  };

  const loadMoreTweets = async () => {
    const req = await fetch(`${url}/api/search/${text}?skip=${skip}&limit=10`, {
      headers: {
        "x-access-token": localStorage.getItem("token") || "",
      },
    });

    const data = await req.json();
    if (data.status === "ok") {
      setTweets((prevTweets) => [...prevTweets, ...data.tweets]);
      setRecommendedTags(data.recommendedTags || []);
      setSkip(skip + 10);
      setHasMoreTweets(data.tweets.length === 10);
    } else {
      console.log(data.error);
    }
  };

  return (
    <div className="HeaderAndFeed">
      <Header title="Search" />
      <form
        className="search-form"
        onSubmit={handleSubmit}
        method="GET"
        action={`${url}/api/search/${text}`}
      >
        <input
          autoFocus
          placeholder="Search users or drops..."
          value={text}
          onChange={handleChange}
        ></input>
        <div className="flex items-center justify-between">
          <button
            disabled={text.length === 0}
            type="submit"
            className={`!ml-2 tweetBtn ${
              text.trim().length === 0 ? "opacity-50 !cursor-default" : ""
            }`}
          >
            Search
          </button>
          {(users.length > 0 || tweets.length > 0) && (
            <div className="text-sm text-gray-500 !mr-2">
              {users.length} users found, {tweets.length} drops found
            </div>
          )}
        </div>

        {recommendedTags.length > 0 && (
          <div className="recommended-tags !my-4 text-sm text-gray-600">
            <span className="font-semibold">Recommended Tags: </span>
            {recommendedTags.map((tag, idx) => (
              <span
                key={idx}
                className="px-2 py-1 bg-gray-200 rounded-full mx-1 text-xs"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </form>

      <div className="allResults !mt-4">
        {users.length === 0 && tweets.length === 0 && text.length !== 0 ? (
          <div className="text-center mt-10 text-gray-500">
            No exact results found.
            {recommendedTags.length > 0 && (
              <div className="mt-2">
                Try exploring:
                {recommendedTags.map((tag, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setText(tag);
                      document.querySelector(".search-form")?.dispatchEvent(
                        new Event("submit", { bubbles: true, cancelable: true })
                      );
                    }}
                    className="px-3 py-1 my-1 mr-2 bg-blue-100 rounded-full text-sm"
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <Tabs defaultValue="users">
            <TabsList>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="tweets">Drops</TabsTrigger>
              {recommendedTags.length > 0 && <TabsTrigger value="tags">Tags</TabsTrigger>}
            </TabsList>

            <TabsContent value="users">
              {users.map((user: any) => (
                <Usercard
                  key={user._id}
                  avatar={user.avatar}
                  username={user.username}
                  followers={user.followers}
                  score={user.score}
                />
              ))}
            </TabsContent>

            <TabsContent value="tweets">
              {tweets.map((tweet: any) => (
                <Tweet
                  key={tweet._id}
                  body={tweet}
                  user={activeUser}
                  setTweets={setTweets}
                />
              ))}
              {hasMoreTweets && tweets.length > 0 && (
                <button
                  onClick={loadMoreTweets}
                  className="!w-full text-center !my-10 showMore"
                >
                  Show More Drops
                </button>
              )}
            </TabsContent>

            <TabsContent value="tags">
              {recommendedTags.map((tag, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setText(tag);
                    document.querySelector(".search-form")?.dispatchEvent(
                      new Event("submit", { bubbles: true, cancelable: true })
                    );
                  }}
                  className="px-3 py-1 my-1 mr-2 bg-gray-200 rounded-full text-sm"
                >
                  #{tag}
                </button>
              ))}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}

export default SearchArea;
