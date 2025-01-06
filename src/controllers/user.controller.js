import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary, deleteOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessAndRefreshTokens = async (userId) => {
    try {
      const user = await User.findById(userId);
      const accessToken = await user.generateAccessToken();
      //console.log("access token :" + accessToken);

      const refreshToken = await user.generateRefreshToken();
      //console.log("refresh token :" +refreshToken);
      user.refreshToken = refreshToken;
      await user.save({ validateBeforeSave: false });

      return { accessToken, refreshToken };
    } catch (error) {
      throw new ApiError(
        500,
        "Something went wrong while generating refresh and access token"
      );
    }
};

const registerUser = asyncHandler(async (req, res) => {
      const { fullName, email, username, password } = req.body;
      //console.log({fullName,email,username,password});

      // get user details from frontend
      // validation - not empty
      // check if user already exists: username, email
      // check for images, check for avatar
      // upload them to cloudinary, avatar
      // create user object - create entry in db
      // remove password and refresh token field from response
      // check for user creatoin
      // return res

      if (
        [fullName, email, username, password].some((field) => field?.trim() === "")
      ) {
        throw new ApiError(400, "all fields are required");
      }

      const existedUser = await User.findOne({
        $or: [{ username }, { email }],
      });

      if (existedUser) {
        throw new ApiError(409, "User with email or username already exists");
      }
      if (!email.includes("@") || !email.includes(".")) {
        throw new ApiError(400, "Invalid email form at");
      }

      const avatarLocalPath = req.files?.avatar[0]?.path;

      //console.log(req.files);
      // const coverImageLocalPath =  req.files?.coverImage[0]?.path;

      let coverImageLocalPath;
      if (
        req.files &&
        Array.isArray(req.files.coverImage) &&
        req.files.coverImage.length > 0
      ) {
        coverImageLocalPath = req.files.coverImage[0].path;
      }

      if (!avatarLocalPath) {
        throw new ApiError(400, "avatar file is required");
      }
        
      const avatar = await uploadOnCloudinary(avatarLocalPath).catch((error)=>console.log(error));
      const coverImage = await uploadOnCloudinary(coverImageLocalPath).catch((error)=>console.log(error));

      if (!avatar) {
        throw new ApiError(400, "Avatar file is required");
      }

      const user = await User.create({
        username: username.toLowerCase(),
        avatar: {
          public_id: avatar.public_id,
          url: avatar.secure_url
      },
      coverImage: {
          public_id: coverImage?.public_id || "",
          url: coverImage?.secure_url || ""
      },
        email,
        fullName,
        password,
      });

      const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
      );

      if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user");
      }

      return res
        .status(201)
        .json(new ApiResponse(200, createdUser, "User registered Successfully !!"));
});

const loginUser = asyncHandler(async (req, res) => {
        //req.body -> data
        //check username or email avaialble
        //find user
        //password check
        //access and refresh token generate
        //send tokens using cookies

        const { username, email, password } = req.body;

        if (!(username || email)) {
          throw new ApiError(400, "username or email is required");
        }

        const user = await User.findOne({ $or: [{ username }, { email }] });

        if (!user) {
          throw new ApiError(404, "User does not exist");
        }

        const isPasswordValid = await user.isPasswordCorrect(password);

        if (!isPasswordValid) {
          throw new ApiError(401, "Invalid user credentials");
        }

      const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
        user._id
      );

      const loggenInUser = await User.findById(user._id).select(
        "-password -refreshToken"
      );

      const options = {
        httpOnly: true,
        secure: true,
        sameSite: "None"
      };

      return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
          new ApiResponse(
            200,
            {
              user: loggenInUser,
              accessToken,
              refreshToken, //localStorage in frontend
            },
            "User LoggedIn Successfully !!! "
          )
        );
});

const logoutUser = asyncHandler(async (req, res) => {
      await User.findByIdAndUpdate(
        req.user._id,
        {
          $set: {
            refreshToken: undefined,
          },
        },
        {
          new: true,
        }
      );
      const options = {
        httpOnly: true,
        secure: true,
      };

      return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User Logged Out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies?.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
      throw new ApiError(401, "unauthorized request");
  }
console.log(incomingRefreshToken);
console.log(req.cookies);


  const user = await User.findOne({
      refreshToken: incomingRefreshToken
  });

  if (!user) {
      throw new ApiError(401, "Invalid refresh token");
  }

  const { accessToken , refreshToken } = await generateAccessAndRefreshTokens(user._id);

  const options = {
      httpOnly: true,
      secure: true,
      sameSite: "None"
  };

  return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
          new ApiResponse(
              200,
              {
                  accessToken,
                  refreshToken
              },
              "Access token refreshed"
          )
      )});

const changeCurrentPassword = asyncHandler(async (req, res) => {
      const { oldPassword, newPassword } = req.body;
      const user = await User.findById(req.user?._id);
      const isOldPasswordCorrect = await user.isPasswordCorrect(oldPassword);
      if (!isOldPasswordCorrect) {
        throw new ApiError(400, "Incorrect old password");
      }
      user.password = newPassword;
      await user.save({ validateBeforeSave: false });

      return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password changed successfully"));
    });

    const getCurrentUser = asyncHandler(async (req, res) => {
      return res
        .status(200)
        .json(new ApiResponse(200, req.user, "Current user fetched successfully"));
    });

    const updateAccountDetails = asyncHandler(async (req, res) => {
      const { fullName, email } = req.body;
      if (!(fullName || email)) {
        throw new ApiError(400, "All fields required");
      }
      const user = await User.findByIdAndUpdate(
        req.user._id,
        {
          $set: {
            fullName: fullName,
            email: email,
          },
        },
        {
          new: true,
        }
      ).select("-password");

      return res
        .status(200)
        .json(new ApiResponse(200, user, "Account details updated successfully"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
      const avatarLocalPath = req.file?.path;
      if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing");
      }

      const avatar = await uploadOnCloudinary(avatarLocalPath);
      if (!avatar.url) {
        throw new ApiError(400, "Error while uploading on avatar");
      }
      
      const user = await User.findById(req.user._id).select("avatar");
      
      const avatarToDelete = user.avatar.public_id;
  
      const updatedUser = await User.findByIdAndUpdate(
        req.user?._id,
        {
          $set: {
            avatar: {
              public_id: avatar.public_id,
              url: avatar.secure_url
          }
          },
        },
        {
          new: true,
        }
      ).select("-password");

      if (avatarToDelete && updatedUser.avatar.public_id) {
        await deleteOnCloudinary(avatarToDelete);
    }

      return res
        .status(200)
        .json(new ApiResponse(200, updatedUser, "Avatar updated successfully"));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
      const coverImageLocalPath = req.file?.path;
      //console.log(coverImageLocalPath );
      
      if (!coverImageLocalPath) {
        throw new ApiError(400, "cover image file is missing");
      }

      const coverImage = await uploadOnCloudinary(coverImageLocalPath);

      if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading on coverImage");
      }
      const user = await User.findById(req.user._id).select("coverImage");
    
      console.log("user= "+ user);
      
       const coverImageToDelete = user.coverImage.public_id;
       console.log("coverImageToDelete= "+ coverImageToDelete);
      const updatedUser = User.findByIdAndUpdate(
        req.user?._id,
        {
          $set: {
            coverImage: {
              public_id: coverImage.public_id,
              url: coverImage.secure_url
          }
          },
        },
        {
          new: true,
        }
      ).select("-password");
      console.log("updated User="+updatedUser);
      
      if (coverImageToDelete && updatedUser.coverImage.public_id) {
        await deleteOnCloudinary(coverImageToDelete);
    }

      return res
        .status(200)
        .json(new ApiResponse(200, updatedUser, "Cover image updated successfully"));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
      const { username } = req.params;
      console.log(username);

      if (!username?.trim()) {
        throw new ApiError(400, "Username is missing");
      }

      const channel = await User.aggregate([
        {
          $match: {
            username: username?.toLowerCase(),
          },
        },
        {
          $lookup: {
            from: "subscriptions",
            localField: "_id",
            foreignField: "channel",
            as: "subscribers",
          },
        },
        {
          $lookup: {
            from: "subscriptions",
            localField: "_id",
            foreignField: "subscribers",
            as: "subscribedTo",
          },
        },
        {
          $addFields: {
            subscribersCount: {
              $size: "$subscribers",
            },
            channelSubscribedToCount: {
              $size: "$subscribedTo",
            },
            isSubscribed: {
              $cond: {
                if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                then: true,
                else: false,
              },
            },
          },
        },
        {
          $project: {
            fullName: 1,
            username: 1,
            subscribersCount: 1,
            channelSubscribedToCount: 1,
            isSubscribed: 1,
            avatar: 1,
            coverImage: 1,
            email: 1,
          },
        },
      ]);
      if (!channel.length) {
        throw new ApiError("404", "channel does not exists");
      }

      return res
        .status(200)
        .json(
          new ApiResponse(200, channel[0], "User channel fetched successfully")
        );
});

const getWatchHistory = asyncHandler(async (req, res) => {
      const user = await User.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(req.user._id),
          },
        },
        {
          $lookup: {
            from: "videos",
            localField: "watchHistory",
            foreignField: "_id",
            as: "watchHistory",
            pipeline: [
              {
                $lookup: {
                  from: "users",
                  localField: "owner",
                  foreignField: "_id",
                  as: "owner",
                  pipeline: [
                    {
                      $project: {
                        fullName: 1,
                        username: 1,
                        avatar: 1,
                      },
                    },
                  ],
                },
              },
              {
                $addFields: {
                  owner: {
                    $first: "$owner",
                  },
                },
              },
            ],
          },
        },
      ]);
      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            user[0].watchHistory,
            "Watch history fetched successfully"
          )
        );
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserCoverImage,
  updateUserAvatar,
  getUserChannelProfile,
  getWatchHistory,
};
