import styles from './style.less';

const Dashboard = () => {
  return (
    <iframe
      className={styles.dashboard}
      src="http://localhost:3000/projects/1/tables"
      allowFullScreen
    />
  );
};

export default Dashboard;
