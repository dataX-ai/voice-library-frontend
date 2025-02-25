import React, { useState } from 'react';
import { 
    FaMicrophone, 
    FaFolder, 
    FaSearch, 
    FaMicrochip,
    FaCommentDots,
    FaVolumeUp,
    FaExchangeAlt,
    FaUserFriends,
    FaFolderOpen,
    FaDesktop
} from 'react-icons/fa';
import { IoSettings } from 'react-icons/io5';
import styles from './Sidebar.module.css';

const Sidebar = ({ onNavigate }) => {
    const [activeDropdown, setActiveDropdown] = useState(null);

    const sidebarItems = [
        {
            id: 'voice',
            icon: <FaMicrophone />,
            options: [
                { id: 'text-to-speech', icon: <FaCommentDots />, label: 'Text to Speech' },
                { id: 'text-to-sfx', icon: <FaVolumeUp />, label: 'Text to SFX' },
                { id: 'voice-changer', icon: <FaExchangeAlt />, label: 'Voice Changer' },
                { id: 'voice-cloning', icon: <FaUserFriends />, label: 'Voice Cloning' }
            ]
        },
        {
            id: 'folder',
            icon: <FaFolder />,
            options: [
                { id: 'my-models', icon: <FaFolderOpen />, label: 'My Models' }
            ]
        },
        {
            id: 'search',
            icon: <FaSearch />,
            options: [
                { id: 'search-models', icon: <FaSearch />, label: 'Search Models' }
            ]
        },
        {
            id: 'hardware',
            icon: <FaMicrochip />,
            options: [
                { id: 'system-info', icon: <FaDesktop />, label: 'System Info' },
                { id: 'runtimes', icon: <IoSettings />, label: 'Runtimes' }
            ]
        }
    ];

    const handleIconClick = (itemId) => {
        setActiveDropdown(activeDropdown === itemId ? null : itemId);
    };

    const handleOptionClick = (option) => {
        // Call the navigation callback with the selected option
        if (onNavigate) {
            onNavigate(option.id);
        }
        // Optionally close the dropdown after selection
        setActiveDropdown(null);
    };

    return (
        <div className={styles.sidebar}>
            {sidebarItems.map((item) => (
                <div 
                    key={item.id}
                    className={styles.sidebarIcon}
                    onClick={() => handleIconClick(item.id)}
                >
                    {item.icon}
                    {activeDropdown === item.id && (
                        <div className={styles.dropdown}>
                            {item.options.map((option) => (
                                <div 
                                    key={option.id} 
                                    className={styles.option}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleOptionClick(option);
                                    }}
                                >
                                    {option.icon}
                                    <span>{option.label}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default Sidebar; 