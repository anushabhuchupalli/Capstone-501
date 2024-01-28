async function navigate(destination) {
    const mainContent = document.getElementById('mainContent');
    let content;
  
    switch (destination) {
      case 'profile':
        content = '<h2>Profile Page</h2>';
        break;
  
      case 'home':
        try {
          const response = await fetch('/api/sports');
          const sports = await response.json();
          content = createSportsElement(sports);
        } catch (error) {
          console.error('Error loading sports data:', error);
          content = '<p>Error loading content</p>';
        }
        break;
  
      case 'schedules':
        content = '<h2>Schedules Page</h2>';
        break;
  
      case 'logout':
        content = '<h2>Logout Page</h2>';
        break;
  
      default:
        console.log(`Unknown destination: ${destination}`);
    }
  
    mainContent.innerHTML = content;
  }
  
  function createSportsElement(sports) {
    const sportsContainer = document.createElement('div');
    sportsContainer.className = 'available-sports-container';
  
    const heading = document.createElement('h2');
    heading.textContent = 'Available Sports';
    sportsContainer.appendChild(heading);
  
    const sportsList = document.createElement('div');
    sportsList.className = 'available-sports';
  
    sports.forEach(sport => {
      const sportElement = document.createElement('p');
      sportElement.textContent = sport.name;
      sportsList.appendChild(sportElement);
    });
  
    sportsContainer.appendChild(sportsList);
  
    return sportsContainer.outerHTML;
  }
  