// 点击 subtitle 切换颜色
const subtitle = document.querySelector('.subtitle');
subtitle.addEventListener('click', () => {
  if (subtitle.style.color === 'black') {
    subtitle.style.color = 'white';
  } else {
    subtitle.style.color = 'black';
  }
});

document.getElementById('btn').addEventListener('click', () => {
  alert('点击了');
});
