
const RED = "red";
const BLACK = "black";

class TreeNode {
	constructor(parent, num) {
		this.data = num;
		this.leftChild   = null;
		this.rightChild  = null;
		this.color = RED;
		this.parent = parent;
	}
	grandParent() {
		if(this.parent == null) {
			return null;
		}
		return this.parent.parent;
	}
	sibling() {
		if(this.parent == null) {
			return null;
		}
		return this == this.parent.leftChild ? this.parent.rightChild : this.parent.leftChild;
	}
	uncle() {
		if(this.parent == null) {
			return null;
		}
		return this.parent.sibling();
	}
}

class RedBlackTree {

	constructor() {
		this.root = null;
	}

	singleRotateWithLeft(presentNode) {
		let node = presentNode.rightChild;          //新的父节点
		
		presentNode.rightChild = node.leftChild;
		if(presentNode.rightChild != null) {
			presentNode.rightChild.parent = presentNode;
		}

		node.leftChild = presentNode;
		node.parent = presentNode.parent;

		if(presentNode.parent != null) {
			presentNode.parent.leftChild = node;
		}else {
			this.root = node;
		}

		presentNode.parent = node;
		return node;
	}
	singleRotateWithRight(presentNode) {
		let node = presentNode.leftChild;

		presentNode.leftChild = node.rightChild;
		if(presentNode.leftChild != null) {
			presentNode.leftChild.parent = presentNode;
		}
		node.rightChild = presentNode;
		node.parent = presentNode.parent;
		
		if(presentNode.parent != null) {
			presentNode.parent.rightChild = node;
		}else {
			this.root = node;
		}

		presentNode.parent = node;
		return node;
	}

	insertNode(num) {
		let insertedPos = null;
		if(this.root == null) {
			this.root = new TreeNode(null, num);
			insertedPos = this.root;
		}else {
			insertedPos = this.root;
			while(insertedPos != null) {
				if(num < insertedPos.data) {
					if(insertedPos.leftChild == null) {
						insertedPos.leftChild = new TreeNode(insertedPos, num);
						insertedPos = insertedPos.leftChild;
						break;
					}
					insertedPos = insertedPos.leftChild;
				}else if(num > insertedPos.data) {
					if(insertedPos.rightChild == null) {
						insertedPos.rightChild = new TreeNode(insertedPos, num);
						insertedPos = insertedPos.rightChild;
						break;
					}
					insertedPos = insertedPos.rightChild;
				}else {
					// ignore data
					return;
				}
			}
		}
		this.adjustTree(insertedPos);
	}

	findDeletedPosition(num, curNode) {
		while(curNode != null) {
			if(num < curNode.leftChild) {
				curNode = curNode.leftChild;
			}else if(num > curNode.rightChild) {
				curNode = curNode.rightChild;
			}else {
				return curNode;
			}
		}
		console.log('can not find the element');
		return null;
	}
	deleteNodeByPosition(deletedPos) {
		if(deletedPos.leftChild == null && deletedPos.rightChild == null) {
			if(deletedPos.parent == null) {
				this.root = null;
				return;
			}else {
				if(deletedPos.parent.leftChild == deletedPos) {
					deletedPos.parent.leftChild = null;
				}else {
					deletedPos.parent.rightChild = null
				}
			}
		}else if(deletedPos.leftChild == null && deletedPos.rightChild != null) {
			if(deletedPos.parent == null) {
				this.root = deletedPos.rightChild;
				deletedPos = deletedPos.rightChild;
			}else {
				if(deletedPos.parent.leftChild == deletedPos) {
					deletedPos.parent.leftChild = deletedPos.rightChild;
				}else {
					deletedPos.parent.rightChild = deletedPos.rightChild;
				}
			}
		}else if(deletedPos.leftChild != null && deletedPos.rightChild == null) {
			if(deletedPos.parent == null) {
				this.root = deletedPos.leftChild;
				deletedPos = deletedPos.leftChild;
			}else {
				if(deletedPos.parent.leftChild == deletedPos) {
					deletedPos.parent.leftChild = deletedPos.leftChild;
				}else {
					deletedPos.parent.rightChild = deletedPos.rightChild;
				}
			}
		}else {
			console.log(deletedPos);
			let successor = this.findSuccessor(deletedPos.rightChild);
			deletedPos.data = successor.data;
			this.deleteNodeByPosition(successor);
		}
	}
	deleteNode(num) {
		let deletedPos = this.findDeletedPosition(num, this.root);
		if(deletedPos == null) {
			return;
		}
		this.deleteNodeByPosition(deletedPos);
	}
	findSuccessor(curNode) {
		while(curNode != null) {
			if(curNode.leftChild == null) {
				return curNode;
			}
			curNode = curNode.leftChild;
		}
		return curNode;
	}

	adjustTree(presentNode) {

		while(presentNode != null) {
			if(presentNode.parent == null) {
				presentNode.color = BLACK;
				break;
			}else if(presentNode.parent.color == BLACK) {
				// do nothing;
				break;
			}else if(presentNode.uncle() != null && presentNode.uncle().color == RED) {
				// 情况 3
				presentNode.parent.color = BLACK;
				presentNode.uncle().color = BLACK;
				presentNode.grandParent().color = RED;
				presentNode = presentNode.grandParent();
			}else if(presentNode == presentNode.parent.rightChild && presentNode.parent == presentNode.grandParent().leftChild) {
				// 情况 4
				let node = this.singleRotateWithLeft(presentNode.parent);
				presentNode = node.leftChild;
			}else if(presentNode == presentNode.parent.leftChild && presentNode.parent == presentNode.grandParent().rightChild) {
				// 情况 4
				let node = this.singleRotateWithRight(presentNode.parent);
				presentNode = node.rightChild;
			}else {
				// 情况 5
				presentNode.parent.color = BLACK;
				presentNode.grandParent().color = RED;
				if(presentNode == presentNode.parent.leftChild && presentNode.parent == presentNode.grandParent().leftChild) {
					this.singleRotateWithRight(presentNode.grandParent());
					break;
				}else {
					this.singleRotateWithLeft(presentNode.grandParent());
					break;
				}
			}
		}
	}

	traverseTree() {
		let queue = [this.root];
		let output = "";
		while(queue.length != 0) {
			let newQueue = [];
			for(let i = 0; i < queue.length; i++) {
				if(queue[i] == null) {
					output += "null  ";
				}else {
					output += queue[i].data + ": " + queue[i].color + " ";
					newQueue.push(queue[i].leftChild);
					newQueue.push(queue[i].rightChild);
				}
			}
			output += '\n';
			queue = newQueue;
		}
		console.log(output);
	}
	findNumber(num) {
	}
}

let tree = new RedBlackTree();
tree.insertNode(10);
tree.insertNode(85);
tree.insertNode(15);
tree.insertNode(70);
tree.insertNode(20);
tree.insertNode(60);
tree.insertNode(30);
tree.insertNode(50);
tree.insertNode(65);
tree.insertNode(80);
tree.insertNode(90);
tree.insertNode(40);
tree.insertNode(5);
tree.insertNode(55);
tree.deleteNode(30);
tree.traverseTree();
