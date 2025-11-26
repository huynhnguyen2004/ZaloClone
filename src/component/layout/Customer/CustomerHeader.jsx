import React, { useState, useEffect } from "react";
import { 
    BiSearch, 
    BiPhone, 
    BiVideo, 
    BiPlus
} from "react-icons/bi";
import { RiMessage3Line } from "react-icons/ri";
import UserDropdown from "../../UserDropdown/UserDropdown";
import { search as searchUsers } from "../../../api/service/userService";
import "./CustomerHeader.css";

function CustomerHeader({ onProfileClick }) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (!query || query.trim().length < 2) {
            setResults([]);
            setOpen(false);
            return;
        }

        const handle = setTimeout(async () => {
            try {
                setLoading(true);
                const data = await searchUsers({ key: query.trim() });
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

    return (
        <div className="header-container">
            <div className="header-left">
                <div className="logo-section">
                    <div className="zalo-logo">
                        <RiMessage3Line className="logo-icon" />
                        <span className="logo-text">Zalo</span>
                    </div>
                </div>
            </div>
            
            <div className="header-center">
                <div className="search-container">
                    <BiSearch className="search-icon" />
                    <input 
                        type="text" 
                        placeholder="Tìm kiếm tin nhắn, liên hệ"
                        className="search-input"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />

                    {open && (
                        <div className="search-dropdown">
                            {loading ? (
                                <div className="search-dropdown-item search-loading">
                                    Đang tìm kiếm...
                                </div>
                            ) : results.length > 0 ? (
                                results.map((user) => (
                                    <div
                                        key={user.id || user.phone}
                                        className="search-dropdown-item"
                                    >
                                        <div className="search-avatar">
                                            {user.avatarUrl ? (
                                                <img src={user.avatarUrl} alt={user.firstname || user.phone} />
                                            ) : (
                                                <span>
                                                    {(user.firstname || user.phone || "U").charAt(0)}
                                                </span>
                                            )}
                                        </div>
                                        <div className="search-info">
                                            <div className="search-name">
                                                {user.firstname && user.lastName
                                                    ? `${user.firstname} ${user.lastName}`
                                                    : user.senderName ||
                                                      user.phone ||
                                                      "Người dùng"}
                                            </div>
                                            {user.phone && (
                                                <div className="search-phone">{user.phone}</div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="search-dropdown-item search-empty">
                                    Không tìm thấy kết quả
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            
            <div className="header-right">
                <div className="header-actions">
                    
                    
                    <button className="action-btn" title="Thêm">
                        <BiPlus />
                    </button>
                </div>
                
                <div className="user-info">
                    <UserDropdown onProfileClick={onProfileClick} />
                </div>
            </div>
        </div>
    );
}

export default CustomerHeader;