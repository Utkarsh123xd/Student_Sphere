"use client";

import React, { useState, useEffect, useContext } from "react";
import { useRouter } from "next/navigation";
import { AiFillCamera } from "react-icons/ai";
import jwtDecode from "jwt-decode";
import axios from "axios";
import { UrlContext } from "../context/urlContext";
import AppLoader from "./AppLoader";
import Tweet from "./Tweet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./components/ui/dialog";
import { showToast } from "./ToastComponent";
import { formatContentWithLinks } from "utils/utils";

function ProfileBody({ userName }: { userName: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [tweets, setTweets] = useState([]);
  const [activeUser, setActiveUser] = useState("");
  const [followers, setFollowers] = useState(0);
  const [followBtn, setFollowBtn] = useState("");
  const [banner, setBanner] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("initial-avatar.png");
  const router = useRouter();
  const url = useContext(UrlContext);
  const isActiveUser = activeUser === userName;

  const [additionalInfo, setAdditionalInfo] = useState({
    program: "",
    dept: "",
    year: "",
    graduation: "",
    undergradCollege: "",
    specialization: "",
    cg: "",
    linkedin: "",
    major: "",
  });

  // Populate additionalInfo when fetching user data
  const populateUserData = async () => {
    setLoading(true);
    setError(false);

    try {
      const req = await fetch(`${url}/api/profile/${userName}`, {
        headers: {
          "x-access-token": localStorage.getItem("token"),
        },
      });

      const data = await req.json();

      if (data.status === "ok") {
        setAdditionalInfo({
          program: data.program || "",
          dept: data.dept || "",
          year: data.year || "",
          graduation: data.graduation || "",
          undergradCollege: data.undergradCollege || "",
          specialization: data.specialization || "",
          cg: data.cg || "",
          linkedin: data.linkedin || "",
          major: data.major || "",
        });

        setTweets(data.tweets);
        setActiveUser(data.activeUser);
        setBio(data.bio);
        setBanner(data.banner);
        setFollowers(data.followers);
        setFollowBtn(data.followBtn);
        setAvatar(data.avatar);
      } else {
        setError(true);
        showToast({
          heading: "Error",
          message: data.message || "Failed to fetch profile data.",
          type: "error",
        });
      }
    } catch (error) {
      setError(true);
      showToast({
        heading: "Error",
        message: "Something went wrong while fetching profile data.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const showMoreTweets = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const req = await fetch(
        `${url}/api/profile/${userName}?t=${tweets.length}`,
        {
          headers: {
            "x-access-token": localStorage.getItem("token"),
          },
        }
      );

      const data = await req.json();

      if (data.status === "ok") {
        const updatedTweets = data.tweets.map((tweet) => ({
          ...tweet,
          likeTweetBtn: tweet.likeTweetBtn || "black",
          retweetBtn: tweet.retweetBtn || "black",
        }));

        // Append only new tweets to avoid duplicates
        setTweets((prevTweets) => [
          ...prevTweets,
          ...updatedTweets.filter(
            (newTweet) =>
              !prevTweets.some((tweet) => tweet._id === newTweet._id)
          ),
        ]);
      } else {
        console.error("Error fetching more tweets:", data.message);
        showToast({
          heading: "Error",
          message: data.message || "Failed to fetch more tweets.",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error fetching more tweets:", error);
      showToast({
        heading: "Error",
        message: "Something went wrong while fetching more tweets.",
        type: "error",
      });
    }
  };

  // Retry fetching profile data
  const retryFetch = () => {
    setLoading(true);
    populateUserData();
  };

  // Handle follow/unfollow
  const handleFollow = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch(
        `${url}/api/user/${activeUser}/follow/${userName}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-access-token": localStorage.getItem("token") || "",
          },
        }
      );

      const data = await response.json();
      if (data.status === "ok") {
        setFollowers(data.followers);
        setFollowBtn(data.followBtn);
      } else {
        showToast({
          heading: "Error",
          message: data.message || "Failed to update follow status.",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error updating follow status:", error);
      showToast({
        heading: "Error",
        message: "Something went wrong while updating follow status.",
        type: "error",
      });
    }
  };

  // Handle avatar selection
  const handleSubmitAvatar = async (e: React.MouseEvent<HTMLImageElement>) => {
    try {
      const avatarId = e.currentTarget.id;
      const response = await axios.post(`${url}/api/avatar/${activeUser}`, {
        avatar: `Avatar-${avatarId}.png`,
      });

      if (response.data.status === "ok") {
        setAvatar(response.data.avatar);
        showToast({
          heading: "Success 🎉",
          message: "Avatar updated successfully.",
          type: "success",
        });
      } else {
        showToast({
          heading: "Error",
          message: response.data.message || "Failed to update avatar.",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error updating avatar:", error);
      showToast({
        heading: "Error",
        message: "Something went wrong while updating avatar.",
        type: "error",
      });
    }
  };

  const handleProfileUpdate = async (field, value) => {
    try {
      const response = await axios.post(
        `${url}/api/update-profile/${activeUser}`,
        {
          field: field,
          value: value,
        },
        {
          headers: {
            "x-access-token": localStorage.getItem("token") || "",
          },
        }
      );

      if (response.data.status === "ok") {
        setAdditionalInfo((prev) => ({
          ...prev,
          [field]: value,
        }));

        showToast({
          heading: "Success 🎉",
          message: `${
            field.charAt(0).toUpperCase() + field.slice(1)
          } updated successfully.`,
          type: "success",
        });
      } else {
        showToast({
          heading: "Error",
          message: response.data.message || `Failed to update ${field}.`,
          type: "error",
        });
      }
    } catch (error) {
      showToast({
        heading: "Error",
        message: `Something went wrong while updating ${field}.`,
        type: "error",
      });
    }
  };

  // Fetch user data on component mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const user = jwtDecode(token);
      if (!user) {
        localStorage.removeItem("token");
        router.push("/");
      } else {
        populateUserData();
      }
    } else {
      router.push("/");
    }
  }, []); // Add userName as a dependency

  return (
    <div className="container">
      {banner?.trim()?.length > 0 && (
        <div className="relative !w-full !h-48 overflow-hidden  bg-gray-100">
          <img
            className="!w-full !h-full !object-cover"
            src={banner}
            alt="Banner"
          />
        </div>
      )}
      <div className="!p-4 flex-avatar justify-between !w-full border-b border-border !mb-4">
        <div className="flex items-center gap-4">
          <img
            className="profile-avatar"
            src={`${url}/images/${avatar}`}
            alt="Avatar"
          />
          <div className="flex flex-col gap-1">
            <div className="!px-4 userName">{userName}</div>
            <div className="!px-4 text-lg">{formatContentWithLinks(bio)}</div>
            <div className="!px-4 followFollowing">
              <div>
                <b>{followers}</b> Followers
              </div>
            </div>
          </div>
        </div>
        {isActiveUser ? (
          <Dialog>
            <DialogTrigger asChild>
              <button className="tweetBtn">Edit Profile</button>
            </DialogTrigger>
            <DialogContent className="!p-4 overflow-y-auto !max-h-[70%]">
              <DialogHeader>
                <DialogTitle>Edit Profile</DialogTitle>
              </DialogHeader>
              <div className="!pt-4 edit-profile-container flex flex-col gap-4">
                {/* Avatar Section */}
                <div className="flex flex-col gap-2 mb-4">
                  <span className="text-gray-700">Click to change avatar</span>
                  <img
                    className="profile-avatar cursor-pointer"
                    src={`/images/${avatar}`}
                    alt="Avatar"
                    onClick={(e) => {
                      e.stopPropagation();
                      document.getElementById("avatar-dialog-trigger")?.click();
                    }}
                  />
                </div>

                {/* Banner Input */}
                <div className="mb-4">
                  <label className="text-gray-700 block font-medium mb-2">
                    Banner Image URL
                  </label>
                  <input
                    type="text"
                    className="!text-base !w-full !border-b !border-border !p-2"
                    placeholder="Enter banner image URL"
                    defaultValue={banner}
                    onBlur={(e) =>
                      handleProfileUpdate("banner", e.target.value)
                    }
                  />
                </div>

                {/* Bio Input */}
                <div className="!mb-4">
                  <label className="text-gray-700 block font-medium !mb-2">
                    Bio
                  </label>
                  <textarea
                    className="w-full !border-b !border-border !p-2"
                    placeholder="Enter your bio"
                    rows={4}
                    defaultValue={bio}
                    onBlur={(e) => handleProfileUpdate("bio", e.target.value)}
                  />
                </div>

                <div className="!mb-4">
                  <label className="text-gray-700 block font-medium !mb-2">
                    Program
                  </label>
                  <input
                    type="text"
                    className="!text-base !w-full !border-b !border-border !p-2"
                    placeholder="Enter your program"
                    defaultValue={additionalInfo.program}
                    onBlur={(e) =>
                      handleProfileUpdate("program", e.target.value)
                    }
                  />
                </div>

                <div className="!mb-4">
                  <label className="text-gray-700 block font-medium !mb-2">
                    Department
                  </label>
                  <input
                    type="text"
                    className="!text-base !w-full !border-b !border-border !p-2"
                    placeholder="Enter your department"
                    defaultValue={additionalInfo.dept}
                    onBlur={(e) => handleProfileUpdate("dept", e.target.value)}
                  />
                </div>

                <div className="!mb-4">
                  <label className="text-gray-700 block font-medium !mb-2">
                    Year of Graduation
                  </label>
                  <input
                    type="text"
                    className="!text-base !w-full !border-b !border-border !p-2"
                    placeholder="Enter your year of graduation"
                    defaultValue={additionalInfo.year}
                    onBlur={(e) => handleProfileUpdate("year", e.target.value)}
                  />
                </div>

              
                <div className="!mb-4">
                  <label className="text-gray-700 block font-medium !mb-2">
                    CGPA
                  </label>
                  <input
                    type="text"
                    className="!text-base !w-full !border-b !border-border !p-2"
                    placeholder="Enter your CGPA"
                    defaultValue={additionalInfo.cg}
                    onBlur={(e) => handleProfileUpdate("cg", e.target.value)}
                  />
                </div>

                <div className="!mb-4">
                  <label className="text-gray-700 block font-medium !mb-2">
                    Internshhip Experience
                  </label>
                  <input
                    type="text"
                    className="!text-base !w-full !border-b !border-border !p-2"
                    placeholder="Enter your Internship Experience along with the Company you were associated with"
                    defaultValue={additionalInfo.graduation}
                    onBlur={(e) =>
                      handleProfileUpdate("graduation", e.target.value)
                    }
                  />
                </div>

                <div className="!mb-4">
                  <label className="text-gray-700 block font-medium !mb-2">
                    Specialization
                  </label>
                  <input
                    type="text"
                    className="!text-base !w-full !border-b !border-border !p-2"
                    placeholder="Enter your specialization"
                    defaultValue={additionalInfo.specialization}
                    onBlur={(e) =>
                      handleProfileUpdate("specialization", e.target.value)
                    }
                  />
                </div>


                <div className="!mb-4">
                  <label className="text-gray-700 block font-medium !mb-2">
                    Job Status
                  </label>
                  <input
                    type="text"
                    className="!text-base !w-full !border-b !border-border !p-2"
                    placeholder="Enter your current Job Status"
                    defaultValue={additionalInfo.undergradCollege}
                    onBlur={(e) =>
                      handleProfileUpdate("undergradCollege", e.target.value)
                    }
                  />
                </div>

  
                <div className="!mb-4">
                  <label className="text-gray-700 block font-medium !mb-2">
                    LinkedIn Link
                  </label>
                  <input
                    type="text"
                    className="!text-base !w-full !border-b !border-border !p-2"
                    placeholder="Enter your LinkedIn profile link"
                    defaultValue={additionalInfo.linkedin}
                    onBlur={(e) =>
                      handleProfileUpdate("linkedin", e.target.value)
                    }
                  />
                </div>

                <div className="!mb-4">
                  <label className="text-gray-700 block font-medium !mb-2">
                    Projects
                  </label>
                  <input
                    type="text"
                    className="!text-base !w-full !border-b !border-border !p-2"
                    placeholder="Enter your project details in brief"
                    defaultValue={additionalInfo.major}
                    onBlur={(e) => handleProfileUpdate("major", e.target.value)}
                  />
                </div>
              </div>
            </DialogContent>
          </Dialog>
        ) : (
          <div className="followBtn-div">
            <form className="follow-form" onSubmit={handleFollow}>
              <button className="followBtn" type="submit">
                {followBtn}
              </button>
            </form>
          </div>
        )}
      </div>

      <div className="userTweets">
        <div className="text-xl font-bold !mb-4 !ml-4">Drops</div>
        <div className="tweets">
          <ul className="tweet-list">
            {loading ? (
              <div className="h-screen">
                <AppLoader size="md" />
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-screen">
                <p className="text-gray-500 text-lg !mb-4">
                  Failed to fetch profile data. Please try again.
                </p>
                <button className="tweetBtn" onClick={retryFetch}>
                  Retry
                </button>
              </div>
            ) : (
              tweets.map((tweet) => (
                <Tweet
                  key={tweet._id}
                  user={activeUser}
                  body={tweet}
                  setTweets={setTweets}
                />
              ))
            )}
          </ul>
        </div>
      </div>

      {!loading && !error && tweets.length > 0 && (
        <form className="showMore-form !mb-10" onSubmit={showMoreTweets}>
          <button className="showMore" type="submit">
            Show more Drops
          </button>
        </form>
      )}
      {/* Avatar Selection Dialog */}
      <Dialog>
        <DialogTrigger asChild>
          <button id="avatar-dialog-trigger" className="hidden"></button>
        </DialogTrigger>
        <DialogContent className="!p-4 h-3/4 overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Choose Avatar</DialogTitle>
          </DialogHeader>
          <div className="choose-avatar-container">
            {[...Array(15)].map((_, index) => (
              <img
                key={index + 1}
                id={`${index + 1}`}
                className="choose-profile-avatar"
                src={`${url}/images/Avatar-${index + 1}.png`}
                onClick={handleSubmitAvatar}
                alt={`Avatar ${index + 1}`}
              />
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ProfileBody;
