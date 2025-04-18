"use client";

import React, { useEffect, useState, useContext } from "react";
import Tweet from "./Tweet";
import { UrlContext } from "../context/urlContext";
import AppLoader from "./AppLoader";
import Header from "./Header";
import moment from "moment";

function EventTimeline() {
  const [tweets, setTweets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeUser, setActiveUser] = useState("");
  const url = useContext(UrlContext);

  useEffect(() => {
    fetchEventTweets();
  }, []);

  const fetchEventTweets = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${url}/api/topic/Event`, {
        headers: {
          "x-access-token": localStorage.getItem("token") || "",
        },
      });

      const data = await res.json();
      if (data.status === "ok") {
        const sortedTweets = data.tweets.sort((a, b) =>
          moment(b.postedTweetTime, "MMMM Do YYYY").valueOf() -
          moment(a.postedTweetTime, "MMMM Do YYYY").valueOf()
        );

        setTweets(sortedTweets);
        setActiveUser(data.activeUser.username);
      } else {
        console.error(data.error);
      }
    } catch (error) {
      console.error("Error fetching event tweets:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="HeaderAndFeed">
      <Header title="Event Timeline" />
      <div className="userTweets">
        <div className="text-xl font-bold !mb-4 !ml-4">Upcoming Events</div>
        <div className="tweets">
          <ul className="tweet-list">
            {loading ? (
              <div className="h-screen">
                <AppLoader size="md" />
              </div>
            ) : (
              tweets.map((tweet, index) => (
                <Tweet
                  key={index}
                  user={activeUser}
                  body={tweet}
                  setTweets={setTweets}
                />
              ))
            )}
          </ul>
        </div>
      </div>

      {tweets.length === 0 && !loading && (
        <div className="text-center text-gray-500 !mt-20">
          No events found.
        </div>
      )}
    </div>
  );
}

export default EventTimeline;
