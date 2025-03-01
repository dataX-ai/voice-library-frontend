import React, { useState } from 'react';
import styles from './PasswordDialog.module.css';

const PasswordDialog = ({ isOpen, onSubmit, onCancel }) => {
    const [password, setPassword] = useState('');
    
    if (!isOpen) return null;
    
    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(password);
        setPassword(''); // Clear for security
    };
    
    const handleCancel = () => {
        setPassword(''); // Clear for security
        onCancel();
    };
    
    return (
        <div className={styles.overlay}>
            <div className={styles.dialog}>
                <h3>Administrator Password Required</h3>
                <p>Docker installation requires administrator privileges.</p>
                
                <form onSubmit={handleSubmit}>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        autoFocus
                    />
                    
                    <div className={styles.buttons}>
                        <button type="button" onClick={handleCancel}>
                            Cancel
                        </button>
                        <button type="submit">
                            Submit
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PasswordDialog; 