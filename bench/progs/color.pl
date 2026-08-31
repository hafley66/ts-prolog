diff(r, g). diff(r, b). diff(g, r). diff(g, b). diff(b, r). diff(b, g).

col(WA, NT, SA, Q, NSW, V) :-
    diff(WA, NT), diff(WA, SA), diff(NT, SA), diff(NT, Q),
    diff(SA, Q), diff(SA, NSW), diff(Q, NSW), diff(NSW, V), diff(SA, V).

jlist(L, S) :-
    maplist([X, Q]>>format(atom(Q), '"~w"', [X]), L, Qs),
    atomic_list_concat(Qs, ',', Inner),
    format(atom(S), '[~w]', [Inner]).

main :-
    findall([WA, NT, SA, Q, NSW, V], col(WA, NT, SA, Q, NSW, V), Ss),
    forall(member(S, Ss), (jlist(S, J), format('{"c":~w}~n', [J]))).
