import React from 'react';

function ThemeToggle() {
  const [isDarkTheme, setIsDarkTheme] = React.useState(false);

  React.useEffect(() => {
    if (isDarkTheme) {
      document.documentElement.classList.add('dark-theme');
    } else {
      document.documentElement.classList.remove('dark-theme');
    }
  }, [isDarkTheme]);

  const toggleTheme = () => {
    setIsDarkTheme(!isDarkTheme);
  };

  return (
    <button onClick={toggleTheme}>
      {isDarkTheme ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
    </button>
  );
}
export default ThemeToggle;