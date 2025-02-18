import TerminalLogs from '../components/TerminalLogs';
import '../styles/TerminalLogs.css';

const Runtimes = () => {
  const [installationLogs, setInstallationLogs] = useState('');

  const handleDockerInstall = async () => {
    const process = /* your installation process */;
    process.stdout.on('data', (data) => {
      setInstallationLogs(prevLogs => prevLogs + data);
    });
    process.stderr.on('data', (data) => {
      setInstallationLogs(prevLogs => prevLogs + data);
    });
  };

  return (
    <div>
      {installationLogs && <TerminalLogs logs={installationLogs} />}
    </div>
  );
};

export default Runtimes; 