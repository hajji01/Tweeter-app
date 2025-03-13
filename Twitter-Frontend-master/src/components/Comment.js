import React, { useState, useContext } from "react";
import { AiOutlineLike } from "react-icons/ai";
import { Link } from "react-router-dom";
import { BsThreeDots } from "react-icons/bs";
import { RiDeleteBin6Fill } from "react-icons/ri";
import { AiFillEdit } from "react-icons/ai";
import Popup from "reactjs-popup";
import "reactjs-popup/dist/index.css";
import { nodeUrlContext } from "../index";

function Comment(props) {
  const [likeCount, setLikeCount] = useState(props.body.likes.length);
  const [btnColor, setBtnColor] = useState(props.body.likeCommentBtn);
  const [commentContent, setCommentContent] = useState(props.body.content);
  const [isEdited, setIsEdited] = useState(props.body.isEdited);
  const commentId = props.body._id; // Utilisation de _id pour MongoDB
  const isUserActive = props.body.postedBy.username === props.user;
  const url = useContext(nodeUrlContext);

  /** Gérer le like du commentaire */
  const handleLike = async (e) => {
    e.preventDefault();
    const action = `${url}/comment/${props.user}/like/${commentId}`;
    console.log("Liking comment:", action);

    try {
      const response = await fetch(action, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();
      console.log("Like response:", data);

      setLikeCount(data.likes);
      setBtnColor(data.btnColor);
    } catch (error) {
      console.error("Error liking comment:", error);
    }
  };

  /** Supprimer un commentaire */
  const deleteComment = async (e) => {
    e.preventDefault();
    const action = `${url}/deleteComment/${commentId}`;
    console.log("Deleting comment:", action);

    try {
      const response = await fetch(action, {
        method: "DELETE", // Utilisation correcte de DELETE
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();
      console.log("Delete response:", data);

      if (data.status === "ok") {
        props.updateLoading(true);
        setTimeout(() => props.updateLoading(false), 300);
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  };

  /** Modifier un commentaire */
  const editComment = async (e) => {
    e.preventDefault();
    const action = `${url}/editComment/${commentId}`;
    console.log("Editing comment:", action, "New Content:", commentContent);

    try {
      const response = await fetch(action, {
        method: "PUT", // Utilisation correcte de PUT
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: commentContent }),
      });
      const data = await response.json();
      console.log("Edit response:", data);

      if (data.status === "ok") {
        setIsEdited(true);
        props.updateLoading(true);
        setTimeout(() => props.updateLoading(false), 300);
      }
    } catch (error) {
      console.error("Error editing comment:", error);
    }
  };

  return (
    <li className="comment-items">
      <div className="parent-flex-introduction">
        <img className="tweet-avatar" src={`${url}/images/${props.body.postedBy.avatar}`} alt="avatar" />
        <Link to={`/profile/${props.body.postedBy.username}`}>
          <div className="flex-introduction" style={{ marginBottom: "5px" }}>
            <div className="postedBy">{props.body.postedBy.username}</div>
            <div className="time">· {props.body.postedCommentTime}</div>
            {isEdited && <div>· edited</div>}
          </div>
        </Link>

        {isUserActive && (
          <Popup
            trigger={<button className="threeDots"><BsThreeDots /></button>}
            position="right"
            nested
          >
            <ul className="delete-popup" style={{ listStyle: "none" }}>
              <li key="delete">
                <button className="delete-btn" onClick={deleteComment}>
                  <RiDeleteBin6Fill /> Delete
                </button>
              </li>
              <li key="edit">
                <Popup
                  trigger={<button className="delete-btn"><AiFillEdit /> Edit</button>}
                  modal
                  position="center"
                >
                  <div className="comment-modal">
                    <form style={{ marginBottom: "10px" }} onSubmit={editComment}>
                      <input
                        required
                        autoFocus
                        type="text"
                        value={commentContent}
                        onChange={(e) => setCommentContent(e.target.value)}
                      />
                      <br />
                      <button className="tweetBtn" type="submit">Edit</button>
                    </form>
                  </div>
                </Popup>
              </li>
            </ul>
          </Popup>
        )}
      </div>

      <Link to={`/profile/${props.tweetBy}`}>
        <div className="flex-introduction">
          Replying to <div className="postedBy" style={{ color: "#1DA1F2" }}>@{props.tweetBy}</div>
        </div>
      </Link>

      <div className="content">{commentContent}</div>

      <div className="icons">
        <div style={{ color: btnColor }} className="icon">
          <button onClick={handleLike} className="like-btn">
            <AiOutlineLike />
            <div className="like-count">{likeCount}</div>
          </button>
        </div>
      </div>
    </li>
  );
}

export default Comment;
