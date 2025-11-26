import React from "react";
import { 
    BiSearch, 
    BiPhone, 
    BiVideo, 
    BiPlus
} from "react-icons/bi";
import { RiMessage3Line } from "react-icons/ri";
import UserDropdown from "../../UserDropdown/UserDropdown";
import "./CustomerHeader.css";

function CustomerHeader({ onProfileClick }) {
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
                    />
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