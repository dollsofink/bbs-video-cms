window.ipc = window.ipc || (window.electron && window.electron.ipc);

window.renderTree = async function(rootPath){
  const data = await ipc.invoke("fs:listTree", rootPath, 6);
  const container = document.getElementById("folder-tree");
  container.innerHTML = "";
  container.appendChild(makeUl(data));

  // set root watchers
  ipc.send("fs:watch", rootPath);
  window.router.openDirectory(rootPath);
  document.getElementById('pathBar').value = rootPath;
};

function makeUl(nodes) {
  const ul = document.createElement("ul");
  ul.className = "tree";
  for (const n of nodes) {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.textContent = n.name;
    a.href = "#";
    a.onclick = (e) => {
      e.preventDefault();
      window.router.openDirectory(n.path);
      // expand/collapse behavior is simple: always render full tree for now
    };
    li.appendChild(a);
    if (n.children?.length) li.appendChild(makeUl(n.children));
    ul.appendChild(li);
  }
  return ul;
}

document.getElementById("setRootBtn").addEventListener("click", () => {
  const v = document.getElementById("rootInput").value.trim();
  if (v) window.renderTree(v);
});

// boot
window.renderTree(window.appState.currentRoot);
