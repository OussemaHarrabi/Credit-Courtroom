from langgraph.graph import StateGraph, END
from workflow.debate_state import DebateState
from workflow.nodes import (
    RiskAgentNode, AdvocateAgentNode, ModeratorNode, JudgeNode,
    NODE_RISK, NODE_ADV, NODE_MOD, NODE_JUDGE
)

class CreditDebateWorkflow:
    def _build(self) -> StateGraph:
        g = StateGraph(DebateState)

        g.add_node(NODE_RISK, RiskAgentNode())
        g.add_node(NODE_ADV, AdvocateAgentNode())
        g.add_node(NODE_MOD, ModeratorNode())
        g.add_node(NODE_JUDGE, JudgeNode())

        # Entry
        g.set_entry_point(NODE_RISK)

        # Flow: risk -> moderator -> (adv/risk/judge via Command) ; adv -> moderator ; judge -> END
        g.add_edge(NODE_RISK, NODE_MOD)
        g.add_edge(NODE_ADV, NODE_MOD)
        g.add_edge(NODE_JUDGE, END)

        # IMPORTANT:
        # Moderator returns Command(goto=NODE_X), so we DO NOT add mod->anything edges.
        # LangGraph will follow the Command routing.

        return g

    async def run(self, initial_state: DebateState):
        graph = self._build().compile()
        return await graph.ainvoke(initial_state, config={"recursion_limit": 50})
