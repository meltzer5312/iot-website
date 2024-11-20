// Load AWS Cognito configuration from config.js
const cognitoConfig = window.config.cognito;

// Import necessary modules if using npm (skip if using CDN)
const AmazonCognitoIdentity = window.AmazonCognitoIdentity;

// Handle registration form submission
document.getElementById("registrationForm").addEventListener("submit", async (e) => {
    e.preventDefault(); // Prevent form submission refresh

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!email || !password) {
        alert("Please fill in all fields.");
        return;
    }

    try {
        // Define Cognito User Pool
        const userPool = new AmazonCognitoIdentity.CognitoUserPool({
            UserPoolId: cognitoConfig.userPoolId,
            ClientId: cognitoConfig.userPoolClientId,
        });

        // Register the user
        userPool.signUp(email, password, [], null, (err, result) => {
            if (err) {
                console.error("Registration error:", err.message);
                alert("Error: " + err.message);
                return;
            }

            const cognitoUser = result.user;
            console.log("User registered successfully:", cognitoUser.getUsername());
            alert("Registration successful! Please confirm your email.");
        });
    } catch (error) {
        console.error("Unexpected error:", error);
        alert("An unexpected error occurred. Please try again.");
    }
});
