par(n0, n1). par(n1, n2). par(n2, n3). par(n3, n4). par(n4, n5).
par(n5, n6). par(n6, n7). par(n7, n8). par(n8, n9). par(n9, n10).

anc(X, Y) :- par(X, Y).
anc(X, Z) :- par(X, Y), anc(Y, Z).

main :-
    findall(X, anc(n0, X), Rs),
    forall(member(X, Rs), format('{"x":"~w"}~n', [X])).
