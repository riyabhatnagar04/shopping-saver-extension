document.addEventListener('DOMContentLoaded', () => {
  const saveBtn = document.getElementById('saveBtn');
  const categorySelect = document.getElementById('category');
  const itemList = document.getElementById('itemList');
  const preview = document.getElementById('preview');

  let currentTabTitle = '';
  let currentTabURL = '';
  let savedItems = {};

  // Utility function: truncate titles to 50 characters
  function truncateTitle(title, maxLength = 50) {
    return title.length > maxLength ? title.slice(0, maxLength) + '...' : title;
  }

  // 🔄 Load items from Chrome storage and render
  chrome.storage.local.get('shoppingList', (data) => {
    if (data.shoppingList) {
      savedItems = data.shoppingList;
      renderList();
    }
  });

  // 🌐 Get current tab title + URL for preview
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (chrome.runtime.lastError || !tabs[0]) {
      preview.textContent = "Unable to get current tab.";
      return;
    }

    const tab = tabs[0];
    currentTabTitle = tab.title || '';
    currentTabURL = tab.url || '';

    // Show preview with truncated title
    preview.textContent = `Preview: ${truncateTitle(currentTabTitle)}`;
  });

  // 💾 Save the current tab under selected category
  saveBtn.addEventListener('click', () => {
    const category = categorySelect.value;

    if (!category) {
      alert('Please select a category.');
      return;
    }

    const newItem = {
      title: truncateTitle(currentTabTitle),
      url: currentTabURL
    };

    // Create category if it doesn't exist
    if (!savedItems[category]) {
      savedItems[category] = [];
    }

    // 🚫 Prevent duplicate entries by URL
    const exists = savedItems[category].some(item => item.url === newItem.url);
    if (exists) {
      alert("This item is already saved in this category.");
      return;
    }

    savedItems[category].push(newItem);

    // ✅ Save to Chrome storage and re-render
    chrome.storage.local.set({ shoppingList: savedItems }, renderList);
  });

  // 🧾 Render shopping list grouped by category
  function renderList() {
    itemList.innerHTML = '';

    // Loop through categories
    Object.entries(savedItems).forEach(([category, items]) => {
      const categoryHeader = document.createElement('h4');
      categoryHeader.textContent = category;
      itemList.appendChild(categoryHeader);

      const ul = document.createElement('ul');

      items.forEach((item, index) => {
        const li = document.createElement('li');
        li.style.display = 'flex';
        li.style.justifyContent = 'space-between';
        li.style.alignItems = 'center';

        const link = document.createElement('a');
        link.href = item.url;
        link.textContent = item.title;
        link.target = '_blank';
        link.style.flex = '1';

        const deleteBtn = document.createElement('span');
        deleteBtn.className = 'material-icons delete-icon';
        deleteBtn.textContent = 'delete';
        deleteBtn.title = 'Delete this item';
        deleteBtn.style.cursor = 'pointer';
        deleteBtn.style.marginLeft = '10px';

        // 🗑️ Handle delete
        deleteBtn.addEventListener('click', () => {
          items.splice(index, 1);
          if (items.length === 0) {
            delete savedItems[category]; // remove category if empty
          }
          chrome.storage.local.set({ shoppingList: savedItems }, renderList);
        });

        li.appendChild(link);
        li.appendChild(deleteBtn);
        ul.appendChild(li);
      });

      itemList.appendChild(ul);
    });
  }
});


