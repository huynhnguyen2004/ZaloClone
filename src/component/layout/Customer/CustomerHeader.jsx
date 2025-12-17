import React, { useState, useEffect } from "react";
import { BiSearch, BiPlus, BiUserPlus, BiUserMinus } from "react-icons/bi";
import { RiMessage3Line } from "react-icons/ri";
import { useUser } from "../../../context/UserContext";
import { sendFriendRequest, removeFriend } from "../../../api/service/friend";
import { sendSocketData } from "../../../api/websocket";
import { search as searchUsers } from "../../../api/service/userService";
import UserDropdown from "../../UserDropdown/UserDropdown";
import "./CustomerHeader.css";

function CustomerHeader({ onProfileClick }) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);

    const [sendingIds, setSendingIds] = useState([]);
    const [removingIds, setRemovingIds] = useState([]);
    const {currentUser} =useUser();
    useEffect(() => {
        if (!query || query.trim().length < 2) {
            setResults([]);
            setOpen(false);
            return;
        }

        const handle = setTimeout(async () => {
            try {
                setLoading(true);
                const data = await searchUsers({
                    userId:currentUser.id ,
                    key: query.trim() });
                setResults(Array.isArray(data) ? data : []);
                setOpen(true);
            } catch (err) {
                console.error("Search error:", err);
                setResults([]);
                setOpen(true);
            } finally {
                setLoading(false);
            }
        }, 350);

        return () => clearTimeout(handle);
    }, [query]);

    const handleAddFriend = async (user) => {
        if (!currentUser?.id) return;

       

        const receiverId = user.id;

        if (sendingIds.includes(receiverId)) return;

        setSendingIds((prev) => [...prev, receiverId]);

        try {
            const res = await sendFriendRequest(currentUser.id, receiverId);
            const payload = res?.data || {
                senderId: currentUser.id,
                receiverId,
            };

            try {
                sendSocketData("/app/friend/send", payload);
            } catch (e) {
                console.warn("WS publish failed", e);
            }

            // 🔥 Đóng dropdown sau khi gửi
            setOpen(false);
            setQuery("");

        } catch (err) {
            console.error("Send friend error", err);
        } finally {
            setSendingIds((prev) =>
                prev.filter((i) => i !== receiverId)
            );
        }
    };

    const handleRemoveFriend = async (friendUser) => {
        if (!currentUser?.id) return;

        const friendId = friendUser.id;

        if (removingIds.includes(friendId)) return;

        setRemovingIds((prev) => [...prev, friendId]);

        try {
            await removeFriend(currentUser.id, friendId);

            // Cập nhật lại kết quả tìm kiếm
            setResults((prev) =>
                prev.map((u) =>
                    u.id === friendId ? { ...u, isFriend: false } : u
                )
            );

        } catch (err) {
            console.error("Remove friend error", err);
        } finally {
            setRemovingIds((prev) =>
                prev.filter((i) => i !== friendId)
            );
        }
    };

    return (
        <div className="header-container">
            
            {/* Logo */}
            <div className="header-left">
                <div className="zalo-logo">
                    <RiMessage3Line className="logo-icon" />
                    <span className="logo-text">Chat</span>
                </div>
            </div>

            {/* Search */}
            <div className="header-center">
                <div className="search-container">
                    <BiSearch className="search-icon" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm tin nhắn, liên hệ"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="search-input"
                    />

                    {open && (
                        <div className="search-dropdown">
                            {loading ? (
                                <div className="search-loading">Đang tìm kiếm...</div>
                            ) : results.length > 0 ? (
                                results.map((user) => (
                                    <div key={user.id} className="search-dropdown-item">
                                      

                                        <div className="search-info">
                                            <div className="search-name">
                                                {user.firstname} {user.lastname}
                                            </div>
                                            <div className="search-phone">{user.phone}</div>
                                        </div>

                                        <div className="search-action">
                                            
                                            {user.isFriend ? (
                                                <button
                                                    className="search-remove-btn"
                                                    onClick={() => handleRemoveFriend(user)}
                                                    disabled={removingIds.includes(user.id)}
                                                    title="Hủy bạn bè"
                                                >
                                                    <BiUserMinus />
                                                </button>
                                            ) : (
                                                <button
                                                    className="search-add-btn"
                                                    onClick={() => handleAddFriend(user)}
                                                    disabled={sendingIds.includes(user.id)}
                                                    title="Thêm bạn bè"
                                                >
                                                    <BiUserPlus />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="search-empty">Không tìm thấy kết quả</div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* User */}
            <div className="header-right">
                <button className="action-btn">
                    <BiPlus />
                </button>
                <UserDropdown onProfileClick={onProfileClick} />
            </div>
        </div>
    );
}

export default CustomerHeader;
