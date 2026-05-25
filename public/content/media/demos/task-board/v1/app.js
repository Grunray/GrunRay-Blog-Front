const states = ['todo', 'doing', 'done']
const stateText = {
  todo: '待开始',
  doing: '进行中',
  done: '已完成',
}

const seedTasks = [
  { id: 1, title: '设计项目时间线视觉', state: 'done' },
  { id: 2, title: '实现详情页主次结构', state: 'doing' },
  { id: 3, title: '补充 demo 容器逻辑', state: 'todo' },
]

let tasks = structuredClone(seedTasks)
let nextId = 4

const cardsEl = document.getElementById('cards')
const fillEl = document.getElementById('progressFill')
const progressTextEl = document.getElementById('progressText')

function ratio() {
  if (!tasks.length) return 0
  const doneCount = tasks.filter((task) => task.state === 'done').length
  return Math.round((doneCount / tasks.length) * 100)
}

function rotateState(state) {
  return states[(states.indexOf(state) + 1) % states.length]
}

function render() {
  cardsEl.innerHTML = ''

  for (const task of tasks) {
    const card = document.createElement('article')
    card.className = 'task-card'

    const title = document.createElement('h3')
    title.className = 'task-title'
    title.textContent = task.title
    card.appendChild(title)

    const meta = document.createElement('div')
    meta.className = 'task-meta'

    const badge = document.createElement('span')
    badge.className = `badge ${task.state}`
    badge.textContent = stateText[task.state]
    meta.appendChild(badge)

    const hint = document.createElement('span')
    hint.textContent = `#${task.id}`
    meta.appendChild(hint)
    card.appendChild(meta)

    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'task-btn'
    btn.textContent = '切换状态'
    btn.addEventListener('click', () => {
      task.state = rotateState(task.state)
      render()
    })
    card.appendChild(btn)

    cardsEl.appendChild(card)
  }

  const pct = ratio()
  fillEl.style.width = `${pct}%`
  progressTextEl.textContent = `完成度 ${pct}%（${tasks.filter((x) => x.state === 'done').length}/${tasks.length}）`
}

document.getElementById('addBtn').addEventListener('click', () => {
  tasks.push({
    id: nextId++,
    title: `新增任务 ${nextId - 1}`,
    state: 'todo',
  })
  render()
})

document.getElementById('toggleAllBtn').addEventListener('click', () => {
  tasks = tasks.map((task) => ({ ...task, state: rotateState(task.state) }))
  render()
})

document.getElementById('resetBtn').addEventListener('click', () => {
  tasks = structuredClone(seedTasks)
  nextId = 4
  render()
})

render()
