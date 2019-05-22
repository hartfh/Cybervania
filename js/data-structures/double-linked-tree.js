/* eslint-disable no-use-before-define */
class DoublyLinkedTree {
	constructor() {
		this.root = false;
	}

	addRoot(payload) {
		this.root = new Node(payload);

		return this.root;
	}

	removeNode(evaluator) {
		const {child, index} = this.hasNode(evaluator);

		if(child) {
			child.remove(index);
		}
	}

	hasNode(evaluator) {
		// depth first search. consider switching to breadth first
		return this.root.hasNode(evaluator);
	}
}

class Node {
	constructor(payload, parent) {
		this.payload = payload;
		this.children = [];
		this.parent = parent;
	}

	addNode(payload) {
		const childNode = new Node(payload, this);

		this.children.push(childNode);

		return childNode;
	}

	remove(index) {
		if(this.parent) {
			this.parent.children.splice(index, 1);
			this.parent = null;
		}
	}

	hasNode(evaluator = () => {}) {
		for(let i = 0; i < this.children.length; i++) {
			const child = this.children[i];

			if( evaluator(child.payload) ) {
				return {child, index: i};
			} else if(child.children) {
				const childHasNode = child.hasNode(evaluator);

				if(childHasNode) {
					return childHasNode;
				}
			}
		}

		return false;
	}
}

module.exports = DoublyLinkedTree;
