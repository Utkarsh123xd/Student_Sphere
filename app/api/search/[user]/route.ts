import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { MONGODB_URI, validateToken } from "utils/utils";
const { User, Tweet } = require("utils/models/File");

if (!global.mongoose) {
  global.mongoose = mongoose.connect(MONGODB_URI).catch((err) => {
    console.error("Error connecting to MongoDB:", err);
  });
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ user: string }> }
) {
  try {
    const { user } = await params;
    const url = new URL(req.url);
    const tweetsToSkip = parseInt(url.searchParams.get("skip") || "0");
    const tweetsLimit = parseInt(url.searchParams.get("limit") || "10");

    const validationResponse = await validateToken(req);
    if (validationResponse.status !== "ok") {
      return NextResponse.json(
        { status: "error", message: validationResponse.message },
        { status: 401 }
      );
    }
    const activeUser = validationResponse.user.username;

    // Search for tweets matching the query
    const tweets = await Tweet.find({
      content: { $regex: `${user}`, $options: "i" },
    })
      .populate("postedBy", "username avatar")
      .populate("comments")
      .sort({ createdAt: -1 })
      .skip(tweetsToSkip)
      .limit(tweetsLimit);

    // Get tags from tweets for recommendations
    const tagFrequency = {};
    tweets.forEach((t) => {
      if (t.tag) tagFrequency[t.tag] = (tagFrequency[t.tag] || 0) + 1;
    });
    const topTags = Object.entries(tagFrequency)
      .sort((a: [string, number], b: [string, number]) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag]) => tag);

    // Search for users matching query
    const matchedUsers = await User.find({
      $or: [
        { username: { $regex: user, $options: "i" } },
        { program: { $regex: user, $options: "i" } },
        { dept: { $regex: user, $options: "i" } },
        { year: { $regex: user, $options: "i" } },
        { graduation: { $regex: user, $options: "i" } },
        { undergradCollege: { $regex: user, $options: "i" } },
        { specialization: { $regex: user, $options: "i" } },
        { cg: { $regex: user, $options: "i" } },
        { linkedin: { $regex: user, $options: "i" } },
        { major: { $regex: user, $options: "i" } },
      ],
    });

    // Add blend-like scoring
    const scoredUsers = matchedUsers
      .map((u) => {
        let score = 0;
        if (u.username?.toLowerCase().includes(user.toLowerCase())) score += 3;
        if (u.program?.toLowerCase().includes(user.toLowerCase())) score += 2;
        if (u.dept?.toLowerCase().includes(user.toLowerCase())) score += 2;
        if (u.specialization?.toLowerCase().includes(user.toLowerCase())) score += 1;
        return { user: u, score };
      })
      .sort((a, b) => b.score - a.score)
      .map((entry) => entry.user);

    return NextResponse.json({
      status: "ok",
      activeUser,
      users: scoredUsers,
      tweets,
      recommendations: {
        topTags,
      },
    });
  } catch (err) {
    console.error("Error searching users and tweets:", err);
    return NextResponse.json(
      { status: "error", message: "Internal server error." },
      { status: 500 }
    );
  }
}
