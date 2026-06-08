import type { SafetyFlag } from "@jzmle/core";

export type SafetyClassification = {
  flag: SafetyFlag;
  response: string;
};

const safetyRules: Array<{ flag: SafetyFlag; pattern: RegExp; response: string }> = [
  {
    flag: "self_harm",
    pattern: /(自杀|轻生|不想活|活不下去|结束生命|伤害自己|割腕|跳楼|想死|去死算了)/i,
    response: "我先不继续追问细节。如果你现在可能会伤害自己，请立刻联系身边可信任的人，或拨打当地紧急服务。这里可以先帮你把这段感受安全地记下来。"
  },
  {
    flag: "harm_others",
    pattern: /(杀了他|杀了她|弄死|砍死|打死|伤害他人|报复社会|想杀人)/i,
    response: "我听见这股情绪很强，但我不能帮你计划伤害别人。先把自己和对方拉开一点距离，联系可信任的人或当地紧急服务会更安全。"
  },
  {
    flag: "violent_retaliation",
    pattern: /(报复|威胁|找人弄|让.*付出代价|狠狠干|搞死|毁了他|毁了她|揍一顿|打一顿)/i,
    response: "这股气可以先被记下来，但我不能帮你升级冲突或写威胁内容。我们先把被碰到的边界和你真正想保护的东西留下来。"
  },
  {
    flag: "medical_advice",
    pattern: /(吃什么药|停药|加药|换药|药量|治疗方案|怎么治疗|要不要吃药|开药)/i,
    response: "药物和治疗方案需要由专业医生判断，我不能替你做医疗建议。这里可以先帮你记录最近的状态，方便你之后和医生或咨询师说明。"
  },
  {
    flag: "diagnosis_request",
    pattern: /(我是不是.*抑郁|我是不是.*焦虑|诊断|确诊|心理疾病|人格障碍|双相|抑郁症|焦虑症)/i,
    response: "我不能给你做诊断，但可以帮你把最近发生的事、感受和身体状态整理下来。若这些状态持续影响生活，建议联系专业人士评估。"
  }
];

export function classifySafety(content: string, mode?: string): SafetyClassification | null {
  const normalized = content.trim();
  if (!normalized) return null;

  const angryRetaliation = mode === "angry" ? safetyRules.find((rule) => rule.flag === "violent_retaliation" && rule.pattern.test(normalized)) : null;
  if (angryRetaliation) return { flag: angryRetaliation.flag, response: angryRetaliation.response };

  const rule = safetyRules.find((item) => item.pattern.test(normalized));
  return rule ? { flag: rule.flag, response: rule.response } : null;
}
