let sports = [];
let adminId = null; // Set the default value

// Check if the user data is available
if (typeof userData !== 'undefined' && userData !== null) {
  adminId = userData.id;
}

function displaySports() {
  const sportsContainer = document.getElementById("sportsContainer");
  sportsContainer.innerHTML = "";

  sports.forEach((sport) => {
    const sportCard = document.createElement("div");
    sportCard.classList.add("sport-card");
    sportCard.innerHTML = `
      <h3>${sport.name}</h3>
      <img src="${sport.image_url}" alt="${sport.name}" style="max-width: 100%; max-height: 100px;">
      <button onclick="deleteSport(${sport.id})">Delete</button>
    `;
    sportsContainer.appendChild(sportCard);
  });
}

function deleteSport(sportId) {
  // Send a DELETE request to delete the sport
  fetch(`/admin/sports/delete/${sportId}`, {
    method: 'DELETE',
  })
    .then(response => {
      if (response.ok) {
        // If deletion is successful, update the sports array and display the updated list
        sports = sports.filter(sport => sport.id !== sportId);
        displaySports();
      } else {
        console.error('Failed to delete sport from the server.');
      }
    })
    .catch(error => {
      console.error('Error while deleting sport:', error);
    });
}

document.addEventListener("DOMContentLoaded", () => {
  // Fetch sports data for the logged-in admin
  fetch('/admin_main/profile/sports')
    .then(response => response.json())
    .then(data => {
      // Filter sports by admin ID
      sports = data.filter(sport => sport.AdminId === adminId);
      displaySports();
    });
});
