import common
import os.path
import json
import math
import matplotlib.pyplot as plt
import numpy as np
import scipy.stats

"""
sample counts per graph size for graph gate:
include  6  with  1434 samples
include  7  with  2179 samples
include  8  with  2629 samples
include  9  with  3175 samples
include  10  with  3837 samples
include  11  with  4988 samples
include  12  with  5681 samples
include  13  with  6188 samples
include  14  with  6874 samples
include  15  with  7936 samples
include  16  with  7333 samples
include  17  with  8461 samples
include  18  with  7776 samples
include  19  with  6633 samples
include  20  with  6418 samples
include  21  with  5094 samples
include  22  with  5966 samples
include  23  with  5051 samples
include  24  with  4180 samples
include  25  with  4219 samples
include  26  with  3748 samples
include  27  with  3303 samples
include  28  with  2096 samples
include  29  with  1563 samples
include  30  with  2131 samples
include  31  with  1787 samples
include  32  with  1472 samples

aggregated counts:
[
    122152, 122152, 122152, 122152, 122152, 122152, 120718, 118539,
    115910, 112735, 108898, 103910, 98229, 92041, 85167, 77231,
    69898, 61437, 53661, 47028, 40610, 35516, 29550, 24499,
    20319, 16100, 12352, 9049, 6953, 5390, 3259, 1472
]
"""

token_count_node_rank = [
    1.974785513131181, 1.7037052197262428, 1.702485427991355, 1.6848352871831815, 1.6628053572598074, 1.6504764555635603,
    1.6348266207193625, 1.615502071048347, 1.5919592787507548, 1.5782587483922472, 1.5701482120883763, 1.5621884322971802,
    1.5491860855755428, 1.5470170902097977, 1.5371916352577877, 1.5316517978531936, 1.5214312283613265, 1.5196054494848381,
    1.514451836529323, 1.5094199200476313, 1.5062792415661168, 1.5026748507714833, 1.504906937394247, 1.5010408588105637,
    1.5155765539642698, 1.5241614906832297, 1.5158678756476685, 1.5281246546579732, 1.500503379836042, 1.4946196660482374,
    1.476219699294262, 1.4898097826086956
]
question_cooc_node_rank = [
    0.4078279520597289, 0.21788427532909818, 0.11512705481694938, 0.08314231449341804, 0.06360927369179382, 0.0517470037330539,
    0.04455010851737106, 0.03869612532584213, 0.033715813993615736, 0.02968909389275735, 0.026832448713474996, 0.025897411221249157,
    0.02313980596361563, 0.021555611086363686, 0.019279767985252504, 0.01868420711890303, 0.01935677701794043, 0.01767664436740075,
    0.01828143344328283, 0.016883558730968785, 0.01657227283920217, 0.016612231107106655, 0.015668358714043994, 0.01510265725131638,
    0.01629017176042128, 0.016273291925465838, 0.01716321243523316, 0.014918775555309979, 0.014957572270962175, 0.013543599257884972,
    0.014114759128567045, 0.016983695652173912
]
prediction_cooc_node_rank = [
    0.42176141201126466, 0.10844685310105442, 0.04399436767306307, 0.031698212063658394, 0.023896456873403627, 0.02055635601545615,
    0.016816050630394805, 0.014788381882755885, 0.013035976188422052, 0.011398412205614938, 0.010082829804036806, 0.009055913771533057,
    0.007696301499557157, 0.007094664334372725, 0.006363967264315991, 0.0055806606155559295, 0.005808463761481015, 0.005176033986034475,
    0.004882503121447606, 0.004805647699243004, 0.004974144299433637, 0.004673949769118144, 0.004399323181049069, 0.004694069145679415,
    0.003691126531817511, 0.004409937888198758, 0.0038050518134715027, 0.0044203779423140676, 0.0035955702574428303, 0.003339517625231911,
    0.0027615833077631177, 0.001358695652173913
]
question_cooc_node_rank_balanced = [
    0.32411462722266693, 0.2007118480151117, 0.10612936518631635, 0.07744729174354488, 0.06003722313075678, 0.04920593063181439,
    0.042767970367624586, 0.03759252844544775, 0.0332386418403585, 0.029522988207258863, 0.0268201519563149, 0.02601743693453387,
    0.023442164030997914, 0.021867886092624692, 0.019684091080312147, 0.019145036694090678, 0.01996743577486422, 0.018256207252639867,
    0.01894507612339476, 0.017554784033180663, 0.01726705049009999, 0.01735020144457969, 0.016340127342171003, 0.015790737990614048,
    0.01686900086666618, 0.01675660398319194, 0.01776964713011344, 0.01532201816272185, 0.01564464479449343, 0.014221485989049426,
    0.015005969174175562, 0.01789134342893362
]
prediction_cooc_node_rank_balanced = [
    0.3351880177426296, 0.09989967501995808, 0.04055601283590017, 0.029526970621406634, 0.02255452436533836, 0.01954692166057363,
    0.016143358097113782, 0.014366623580743382, 0.012851481018623769, 0.011334639930184536, 0.010078209051346257, 0.00909788485893585,
    0.007796865819372822, 0.007197444364155205, 0.006497428359031171, 0.0057183027132038, 0.005991706522243069, 0.0053457402452481385,
    0.0050597451012532385, 0.004996701752517417, 0.005182680830609507, 0.004881582101356321, 0.0045879407224238234, 0.004907932078163826,
    0.003822281163141883, 0.00454091176643751, 0.003939497241110056, 0.004539857233399065, 0.0037607319217532274, 0.0035066677781217764,
    0.0029359504905995667, 0.0014313074743146895
]


def generate_node_rank_array(data):
    return range(1, len(data) + 1)


def calculate_spearman_correlation(data, p_threshold=0.05):
    result = scipy.stats.spearmanr(data, generate_node_rank_array(data))

    print("> Spearman rank-order correlation coefficient")
    print("null hypothesis: no correlation")
    print("alternative hypothesis: nonzero correlation")
    print("statistic: {}".format(result.correlation))
    print("p: {}".format(result.pvalue))
    print("-> Based on result, {} null hypothesis.".format("reject" if result.pvalue < p_threshold else "accept"))


def calculate_pearson_correlation(data, p_threshold=0.05):
    result = scipy.stats.pearsonr(data, generate_node_rank_array(data))
    print("> Pearson correlation coefficient")
    print("null hypothesis: no correlation")
    print("alternative hypothesis: nonzero correlation")
    print("statistic: {}".format(result[0]))
    print("p: {}".format(result[1]))
    print("-> Based on result, {} null hypothesis.".format("reject" if result[1] < p_threshold else "accept"))


# unused / non-functional
# def calculate_chi_square():
    # c1 = scipy.stats.chisquare([1/3, 1/3, 1/3], f_exp=None, ddof=0, axis=0)
    # c2 = scipy.stats.chisquare([1/2, 0, 1/2], f_exp=None, ddof=0, axis=0)
    # c3 = scipy.stats.chisquare([1, 0, 0], f_exp=None, ddof=0, axis=0)
    # c4, _ = scipy.stats.chisquare(i_graph_gate, f_exp=None, ddof=0, axis=0)

    # higher statistic -> more specific / less random or evenly spread

    # return

print("Analyzing token_count_node_rank")
calculate_spearman_correlation(token_count_node_rank)
calculate_pearson_correlation(token_count_node_rank)
print()

print("Analyzing question_cooc_node_rank")
calculate_spearman_correlation(question_cooc_node_rank)
calculate_pearson_correlation(question_cooc_node_rank)
print()

print("Analyzing prediction_cooc_node_rank")
calculate_spearman_correlation(prediction_cooc_node_rank)
calculate_pearson_correlation(prediction_cooc_node_rank)
print()

print("Analyzing question_cooc_node_rank_balanced")
calculate_spearman_correlation(question_cooc_node_rank_balanced)
calculate_pearson_correlation(question_cooc_node_rank_balanced)
print()

print("Analyzing prediction_cooc_node_rank_balanced")
calculate_spearman_correlation(prediction_cooc_node_rank_balanced)
calculate_pearson_correlation(prediction_cooc_node_rank_balanced)
print()
