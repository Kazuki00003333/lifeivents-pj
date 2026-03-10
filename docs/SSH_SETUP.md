# GitHub 用 SSH 設定方法

## 1. SSH 鍵を作成する

ターミナルで実行（メールは GitHub に登録しているアドレスにすると分かりやすいです）:

```bash
ssh-keygen -t ed25519 -C "your_email@example.com" -f ~/.ssh/id_ed25519_github
```

- パスフレーズを聞かれたら **Enter 2回**（空のまま）でもよいです
- パスフレーズを付けると、鍵を使うときだけ入力が必要でより安全です

これで次の2つができます:
- **秘密鍵**: `~/.ssh/id_ed25519_github`（人に教えない）
- **公開鍵**: `~/.ssh/id_ed25519_github.pub`（GitHub に登録する方）

---

## 2. ssh-agent に鍵を登録する（任意だが推奨）

```bash
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519_github
```

パスフレーズを付けた場合は、ここで入力します。

---

## 3. GitHub に公開鍵を登録する

### 3-1. 公開鍵をコピーする

```bash
pbcopy < ~/.ssh/id_ed25519_github.pub
```

これでクリップボードに公開鍵が入ります。  
（コピーされない場合は `cat ~/.ssh/id_ed25519_github.pub` で表示して手動でコピー）

### 3-2. GitHub の設定画面を開く

1. **Kazuki00003333** で GitHub にログイン
2. 右上のアイコン → **Settings**
3. 左メニュー **SSH and GPG keys**
4. **New SSH key** をクリック

### 3-3. 鍵を登録する

- **Title**: わかりやすい名前（例: `MacBook`）
- **Key type**: Authentication Key のまま
- **Key**: クリップボードの内容を貼り付け（`pbcopy` でコピーしたもの）

**Add SSH key** で保存。

---

## 4. SSH の設定で GitHub 用の鍵を指定する（鍵のファイル名を変えた場合）

`~/.ssh/id_ed25519_github` のように GitHub 専用のファイル名にした場合は、  
`~/.ssh/config` に次を追加すると、GitHub 接続時に自動でその鍵を使います。

```bash
mkdir -p ~/.ssh
touch ~/.ssh/config
chmod 600 ~/.ssh/config
```

`~/.ssh/config` を開いて、以下を追記:

```
Host github.com
  HostName github.com
  User git
  IdentityFile ~/.ssh/id_ed25519_github
  IdentitiesOnly yes
```

---

## 5. 接続テスト

```bash
ssh -T git@github.com
```

初回は「Are you sure you want to continue connecting?」と出たら **yes** と入力。

成功すると次のように表示されます:

```
Hi Kazuki00003333! You've successfully authenticated, but GitHub does not provide shell access.
```

---

## 6. このリポジトリでプッシュする

リモートがすでに SSH になっていれば、そのまま:

```bash
cd "/Users/okazakikazuki/Downloads/project 2"
git push -u origin main
```

HTTPS のままの場合は、リモートを SSH に変更してからプッシュ:

```bash
git remote set-url origin git@github.com:Kazuki00003333/lifeivents-pj.git
git push -u origin main
```

---

## よくある質問

**Q. 既存の鍵（id_rsa など）を GitHub に登録してもいい？**  
A. はい。既に `~/.ssh/id_rsa.pub` などがあれば、その公開鍵を GitHub に登録するだけでも使えます。その場合は「4. SSH の設定」は不要なことが多いです。

**Q. 複数の GitHub アカウントを使い分けたい**  
A. アカウントごとに別の鍵（例: `id_ed25519_github_kazuki`）を作り、`~/.ssh/config` で `Host github.com-kazuki` のように別名をつけて `IdentityFile` を指定する方法があります。

**Q. Permission denied (publickey) が出る**  
A. 次のことを確認してください:
- 登録した公開鍵が、使っている秘密鍵とペアか
- GitHub にログインしているアカウントが Kazuki00003333 か
- `ssh-add -l` で、使いたい鍵が ssh-agent に追加されているか
