document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build participants list HTML (pretty and resilient)
        const participants = Array.isArray(details.participants) ? details.participants : [];
        let participantsHTML = '<div class="participants"><strong>Participants:</strong>';
        if (participants.length === 0) {
          participantsHTML += '<ul class="participants-list"><li class="no-participants">No participants yet</li></ul>';
        } else {
          participantsHTML += '<ul class="participants-list no-bullets">';
          participants.forEach((p) => {
            const label = typeof p === "string" ? p : (p.name || p.email || JSON.stringify(p));
            const email = typeof p === "string" ? p : (p.email || p.name || "");
            participantsHTML += `<li><span class="participant-label">${label}</span> <button class="delete-participant" title="Remove participant" data-activity="${name}" data-email="${email}">🗑️</button></li>`;
          });
          participantsHTML += '</ul>';
        }
        participantsHTML += '</div>';

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsHTML}
        `;


        activitiesList.appendChild(activityCard);

        // Delegar el evento de eliminar participante
        activityCard.addEventListener("click", async (e) => {
          if (e.target.classList.contains("delete-participant")) {
            const email = e.target.getAttribute("data-email");
            const activity = e.target.getAttribute("data-activity");
            if (confirm(`Are you sure you want to remove ${email} from ${activity}?`)) {
              try {
                const response = await fetch(`/activities/${encodeURIComponent(activity)}/participant?email=${encodeURIComponent(email)}`, {
                  method: "DELETE"
                });
                const result = await response.json();
                if (response.ok) {
                  fetchActivities();
                } else {
                  alert(result.detail || "Error removing participant");
                }
              } catch (err) {
                alert("Network error while removing participant");
              }
            }
          }
        });

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
