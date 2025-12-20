import React, { useState, useRef, useEffect } from "react";
import { 
    BiUser, 
    BiCog, 
    BiLogOut, 
    BiShield,
    BiMoon,
    BiSun,
    BiHelpCircle,
    BiInfoCircle
} from "react-icons/bi";
import { useUser } from "../../context/UserContext";
import { acceptFriendRequest, rejectFriendRequest, unRequestFriend } from "../../api/service/friend";
import { sendSocketData } from "../../api/websocket";
import "./UserDropdown.css";

function UserDropdown({ onProfileClick }) {
    const { currentUser, logout, friendRequests, removeFriendRequest } = useUser();
    const [isOpen, setIsOpen] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleToggle = () => {
        setIsOpen(!isOpen);
    };

    const handleMenuClick = (action) => {
        setIsOpen(false);
        
        switch (action) {
            case 'profile':
                 console.log('Open profile');
                break;
            case 'settings':
                console.log('Open settings');
                break;
            case 'privacy':
                console.log('Open privacy settings');
                break;
            case 'help':
                console.log('Open help');
                break;
            case 'about':
                console.log('Open about');
                break;
            case 'logout':
                logout();
                break;
            case 'darkmode':
                setIsDarkMode(!isDarkMode);
                break;
            default:
                break;
        }
    };

    const handleAccept = async (req) => {
        try {
            const res = await acceptFriendRequest(req.id);
            const payload = (res && res.data) ? res.data : { id: req.id };
            try {
                sendSocketData('/app/friend/accept', payload);
            } catch (sockErr) {
                console.warn('WebSocket publish failed', sockErr);
            }
            removeFriendRequest(req.id);
        } catch (err) {
            console.error('Accept friend error', err);
        }
    };

    const handleDecline = async (req) => {
        try {
            await rejectFriendRequest(req.id);
            removeFriendRequest(req.id);
        } catch (err) {
            console.error('Decline friend error', err);
        }
    };

    return (
        <div className="user-dropdown" ref={dropdownRef}>
            {/* User Avatar Button */}
            <button 
                className="user-dropdown-trigger"
                onClick={handleToggle}
                title={currentUser?.firstname}
            >
                <div className="user-avatar-small">
                    {currentUser?.avatarUrl ? (
                        <img src={currentUser.avatarUrl} alt="Avatar" />
                    ) : (
                        <div className="default-avatar-small">
                            {currentUser?.firstname?.charAt(0) || "U"}
                        </div>
                    )}
                </div>
                {friendRequests?.length > 0 && (
                    <span className="friend-request-badge">{friendRequests.length}</span>
                )}
                
                {currentUser?.firstname && (
                    <span className="user-name-text">{currentUser.firstname}</span>
                )}
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="dropdown-menu">
                    {/* User Info Section */}
                    <div className="dropdown-header">
                        <div className="dropdown-user-info">
                            <div className="dropdown-avatar">
                                {currentUser?.avatarUrl ? (
                                    <img src={currentUser.avatarUrl} alt="Avatar" />
                                ) : (
                                    <div className="default-dropdown-avatar">
                                        <BiUser />
                                    </div>
                                )}
                            </div>
                            <div className="dropdown-user-details">
                                <h4>{currentUser?.firstname} {currentUser?.lastname}</h4>
                                <p>{currentUser?.phone}</p>
                                <p className="user-status" style={{
                                    color: currentUser?.online ? '#31a24c' : '#ccc',
                                    fontSize: '12px'
                                }}>
                                    {currentUser?.online ? '● Đang hoạt động' : '● Ngoại tuyến'}
                                </p>
                            </div>
                        </div>

                    </div>

                    {/* Friend requests (realtime) */}
                    {friendRequests && friendRequests.length > 0 && (
                        <div className="friend-requests-section">
                            <h5>Lời mời kết bạn ({friendRequests.length})</h5>
                            {friendRequests.map((req) => (
                                <div key={req.id} className="friend-request-item">
                                    <div className="fr-info">
                                        <div className="fr-avatar">
                                            {req.senderAvatarUrl ? (
                                                <img src={req.senderAvatarUrl} alt="avatar" />
                                            ) : (
                                                <BiUser />
                                            )}
                                        </div>
                                        <div className="fr-details">
                                            <div className="fr-name">{req.senderName || req.firstname || req.phone}</div>
                                        </div>
                                    </div>
                                    <div className="fr-actions">
                                        <button
                                            className="btn-accept"
                                            onClick={() => handleAccept(req)}
                                        >
                                            Chấp nhận
                                        </button>
                                        <button
                                            className="btn-decline"
                                            onClick={() => handleDecline(req)}
                                        >
                                            Từ chối
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="dropdown-divider"></div>

                    {/* Menu Items */}
                    <div className="dropdown-body">
                        <button 
                            className="dropdown-item"
                            onClick={() => handleMenuClick('profile')}
                        >
                            <BiUser className="dropdown-icon" />
                            <span>Thông tin cá nhân</span>
                        </button>

                        <button 
                            className="dropdown-item"
                            onClick={() => handleMenuClick('settings')}
                        >
                            <BiCog className="dropdown-icon" />
                            <span>Cài đặt</span>
                        </button>

                        <button 
                            className="dropdown-item"
                            onClick={() => handleMenuClick('privacy')}
                        >
                            <BiShield className="dropdown-icon" />
                            <span>Quyền riêng tư</span>
                        </button>

                        <button 
                            className="dropdown-item"
                            onClick={() => handleMenuClick('darkmode')}
                        >
                            {isDarkMode ? (
                                <BiSun className="dropdown-icon" />
                            ) : (
                                <BiMoon className="dropdown-icon" />
                            )}
                            <span>{isDarkMode ? "Chế độ sáng" : "Chế độ tối"}</span>
                        </button>

                        <div className="dropdown-divider"></div>

                        <button 
                            className="dropdown-item"
                            onClick={() => handleMenuClick('help')}
                        >
                            <BiHelpCircle className="dropdown-icon" />
                            <span>Trợ giúp</span>
                        </button>

                        <button 
                            className="dropdown-item"
                            onClick={() => handleMenuClick('about')}
                        >
                            <BiInfoCircle className="dropdown-icon" />
                            <span>Về Zalo</span>
                        </button>

                        <div className="dropdown-divider"></div>

                        <button 
                            className="dropdown-item logout-item"
                            onClick={() => handleMenuClick('logout')}
                        >
                            <BiLogOut className="dropdown-icon" />
                            <span>Đăng xuất</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default UserDropdown;
