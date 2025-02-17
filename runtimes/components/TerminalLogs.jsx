import React, { useEffect, useRef } from 'react';

const TerminalLogs = ({ logs }) => {
  const terminalRef = useRef(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="terminal-container">
      <div className="terminal-header">
        <span>Installation Logs</span>
      </div>
      <pre className="terminal-content" ref={terminalRef}>
        {logs}
      </pre>
    </div>
  );
};

export default TerminalLogs; 