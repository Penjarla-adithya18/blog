const API_URL = 'http://localhost:3001/users';
let isLoading = false;

function showMessage(text, isError = false) {
  const messageDiv = document.getElementById('message');
  messageDiv.textContent = text;
  messageDiv.className = isError ? 'error-message' : 'success-message';
  setTimeout(() => {
    messageDiv.textContent = '';
    messageDiv.className = '';
  }, 3000);
}

function setLoading(loading) {
  isLoading = loading;
  const userList = document.getElementById('userList');
  if (loading) {
    userList.innerHTML = '<div class="loading">Loading users...</div>';
  }
}

async function fetchUsers() {
  setLoading(true);
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error('Failed to fetch users');
    const users = await res.json();
    const list = document.getElementById('userList');
    list.innerHTML = '';
    
    if (users.length === 0) {
      list.innerHTML = '<div class="loading">No users found. Add your first user!</div>';
      return;
    }

    users.forEach(user => {
      const li = document.createElement('div');
      li.className = 'user-item';
      li.innerHTML = `
        <div class="user-info">
          <strong>${user.name}</strong>
          <div>${user.email}</div>
          <div style="margin-top:8px; color:#555; font-size:0.98em; white-space:pre-line;">${user.content || ''}</div>
        </div>
        <div class="user-actions">
          <button class="btn-edit" onclick="editUser('${user._id}', '${user.name}', '${user.email}', '${user.content ? user.content.replace(/'/g, "\\'").replace(/\n/g, "\\n") : ''}')">Edit</button>
          <button class="btn-danger" onclick="deleteUser('${user._id}')">Delete</button>
        </div>
      `;
      list.appendChild(li);
    });
  } catch (err) {
    showMessage('Failed to fetch users', true);
    console.error(err);
  } finally {
    setLoading(false);
  }
}

async function createUser() {
  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const content = document.getElementById('content').value.trim();
  
  if (!name || !email || !content) {
    showMessage('Name, email, and content are required', true);
    return;
  }

  if (!isValidEmail(email)) {
    showMessage('Please enter a valid email address', true);
    return;
  }

  if (content.split(/\s+/).length > 100) {
    showMessage('Content must be 100 words or less', true);
    return;
  }

  setLoading(true);
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, content })
    });

    if (!response.ok) {
      throw new Error('Failed to create user');
    }

    document.getElementById('name').value = '';
    document.getElementById('email').value = '';
    document.getElementById('content').value = '';
    showMessage('User created successfully!');
    fetchUsers();
  } catch (err) {
    showMessage('Failed to create user', true);
    console.error(err);
  } finally {
    setLoading(false);
  }
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function editUser(id, currentName, currentEmail, currentContent) {
  const newName = prompt('New name:', currentName);
  if (!newName) return;

  const newEmail = prompt('New email:', currentEmail);
  if (!newEmail) return;

  if (!isValidEmail(newEmail)) {
    showMessage('Please enter a valid email address', true);
    return;
  }

  const newContent = prompt('New content (100 words):', currentContent || '');
  if (!newContent) return;
  if (newContent.split(/\s+/).length > 100) {
    showMessage('Content must be 100 words or less', true);
    return;
  }

  setLoading(true);
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName, email: newEmail, content: newContent })
    });

    if (!response.ok) {
      throw new Error('Failed to update user');
    }

    showMessage('User updated successfully!');
    fetchUsers();
  } catch (err) {
    showMessage('Failed to update user', true);
    console.error(err);
  } finally {
    setLoading(false);
  }
}

async function deleteUser(id) {
  if (!confirm("Are you sure you want to delete this user?")) return;

  setLoading(true);
  try {
    const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
    
    if (!response.ok) {
      throw new Error('Failed to delete user');
    }

    showMessage('User deleted successfully!');
    fetchUsers();
  } catch (err) {
    showMessage('Failed to delete user', true);
    console.error(err);
  } finally {
    setLoading(false);
  }
}
fetchUsers(); 